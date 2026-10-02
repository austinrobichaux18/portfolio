import { Component, OnDestroy, computed, signal } from '@angular/core';
import { EpisodeHistoryEntry } from '../../core/models/EpisodeHistoryEntry';
import {
  clearLastFolderHandle,
  loadLastFolderHandle,
  saveLastFolderHandle,
} from './video-folder-store';

type VideosViewState =
  'unsupported' | 'idle' | 'loading-folder' | 'show-list' | 'loading-show' | 'browsing' | 'playing';

const HISTORY_FILE_NAME = 'history.json';
const THUMBNAIL_DIR_NAME = '.thumbnails';
const THUMBNAIL_CONCURRENCY = 2;
const THUMBNAIL_WIDTH = 320;
const AUTO_NEXT_STORAGE_KEY = 'other-modules-videos:auto-next';

function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const ss = String(seconds).padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${ss}`;
  }
  return `${minutes}:${ss}`;
}

function isValidHistoryEntry(item: unknown): item is EpisodeHistoryEntry {
  if (typeof item !== 'object' || item === null) return false;
  const e = item as Record<string, unknown>;
  return (
    typeof e['lastPositionSeconds'] === 'number' &&
    typeof e['durationSeconds'] === 'number' &&
    typeof e['completed'] === 'boolean' &&
    typeof e['lastWatchedAt'] === 'string'
  );
}

function isValidHistory(data: unknown): data is Record<string, EpisodeHistoryEntry> {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return false;
  return Object.values(data as Record<string, unknown>).every(isValidHistoryEntry);
}

function readAutoNextPreference(): boolean {
  try {
    return localStorage.getItem(AUTO_NEXT_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Grabs a single frame partway into a video file as a JPEG blob, without ever attaching anything to the DOM. */
function captureVideoFrame(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const sourceUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.muted = true;
    video.preload = 'metadata';

    let settled = false;
    const finish = (blob: Blob | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      URL.revokeObjectURL(sourceUrl);
      video.removeAttribute('src');
      video.load();
      resolve(blob);
    };

    const timeoutId = setTimeout(() => finish(null), 8000);

    video.addEventListener('loadedmetadata', () => {
      const duration = video.duration;
      const seekTime = Number.isFinite(duration) && duration > 0 ? Math.min(60, duration * 0.5) : 0;
      video.currentTime = seekTime;
    });

    video.addEventListener('seeked', () => {
      try {
        const sourceWidth = video.videoWidth;
        const sourceHeight = video.videoHeight;
        if (!sourceWidth || !sourceHeight) {
          finish(null);
          return;
        }
        const scale = THUMBNAIL_WIDTH / sourceWidth;
        const canvas = document.createElement('canvas');
        canvas.width = THUMBNAIL_WIDTH;
        canvas.height = Math.round(sourceHeight * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          finish(null);
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => finish(blob), 'image/jpeg', 0.75);
      } catch {
        finish(null);
      }
    });

    video.addEventListener('error', () => finish(null));
    video.src = sourceUrl;
  });
}

@Component({
  selector: 'app-videos',
  imports: [],
  templateUrl: './videos.html',
  styleUrl: './videos.scss',
})
export class Videos implements OnDestroy {
  viewState = signal<VideosViewState>('showDirectoryPicker' in window ? 'idle' : 'unsupported');

  private dirHandle: FileSystemDirectoryHandle | null = null;

  private lastFolderHandle: FileSystemDirectoryHandle | null = null;

  lastFolderName = signal<string | null>(null);

  hasFolder = signal(false);

  shows = signal<string[]>([]);

  private showDirHandle: FileSystemDirectoryHandle | null = null;

  selectedShowName = signal<string | null>(null);

  /** Stack of directory handles from the show's root down to the folder currently being browsed. */
  private folderHandleStack: FileSystemDirectoryHandle[] = [];

  /** Breadcrumb of folder names below the show root, e.g. ['season1'] or ['movies']. */
  folderPathSegments = signal<string[]>([]);

  subfolders = signal<string[]>([]);

  episodes = signal<string[]>([]);

  /** Thumbnail object URLs for display, keyed the same way as `history` (path relative to the show root). */
  thumbnailUrls = signal<Record<string, string>>({});

  private thumbnailObjectUrls: string[] = [];

  /** Bumped every time the browsed folder changes, so stale thumbnail generation from a folder the user already left can't write into the current list. */
  private browseGeneration = 0;

  /** Keyed by path relative to the show root (e.g. "season1/ep1.mp4"), so nested folders don't collide. */
  history = signal<Record<string, EpisodeHistoryEntry>>({});

  selectedEpisodeFileName = signal<string | null>(null);

  readonly selectedEpisodeKey = computed(() => {
    const name = this.selectedEpisodeFileName();
    return name ? this.relativeKeyFor(name) : null;
  });

  videoSrc = signal<string | null>(null);

  private currentObjectUrl: string | null = null;

  private lastProgressSaveAt = 0;

  autoNext = signal<boolean>(readAutoNextPreference());

  errorMessage = signal('');

  saveWarning = signal('');

  readonly hasPreviousEpisode = computed(() => this.adjacentEpisodeName(-1) !== null);

  readonly hasNextEpisode = computed(() => this.adjacentEpisodeName(1) !== null);

  private get currentDirHandle(): FileSystemDirectoryHandle | null {
    return this.folderHandleStack[this.folderHandleStack.length - 1] ?? null;
  }

  relativeKeyFor(name: string): string {
    return [...this.folderPathSegments(), name].join('/');
  }

  constructor() {
    if (this.viewState() === 'idle') {
      this.checkLastFolder();
    }
  }

  ngOnDestroy(): void {
    this.revokeCurrentObjectUrl();
    this.revokeThumbnailUrls();
  }

  private async checkLastFolder(): Promise<void> {
    try {
      const handle = await loadLastFolderHandle();
      if (!handle) return;
      this.lastFolderHandle = handle;
      this.lastFolderName.set(handle.name);
    } catch {
      // No remembered folder available — not an error, just skip the shortcut.
    }
  }

  async pickFolder(): Promise<void> {
    this.errorMessage.set('');

    try {
      this.dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      this.errorMessage.set('Unable to access that folder.');
      return;
    }

    this.hasFolder.set(true);
    this.lastFolderHandle = this.dirHandle;
    this.lastFolderName.set(this.dirHandle.name);
    saveLastFolderHandle(this.dirHandle).catch(() => {});

    await this.loadFolderContents();
  }

  async continueWithLastFolder(): Promise<void> {
    if (!this.lastFolderHandle) return;
    this.errorMessage.set('');

    try {
      let permission = await this.lastFolderHandle.queryPermission({ mode: 'readwrite' });
      if (permission !== 'granted') {
        permission = await this.lastFolderHandle.requestPermission({ mode: 'readwrite' });
      }
      if (permission !== 'granted') {
        this.errorMessage.set('Permission to access that folder was not granted.');
        return;
      }
    } catch {
      this.errorMessage.set('That folder is no longer available. Choose a folder to continue.');
      this.lastFolderHandle = null;
      this.lastFolderName.set(null);
      clearLastFolderHandle().catch(() => {});
      return;
    }

    this.dirHandle = this.lastFolderHandle;
    this.hasFolder.set(true);
    await this.loadFolderContents();
  }

  private async loadFolderContents(): Promise<void> {
    this.viewState.set('loading-folder');

    try {
      await this.loadShowList();
      this.viewState.set('show-list');
    } catch {
      this.errorMessage.set('Unable to read folder contents.');
      this.viewState.set('idle');
    }
  }

  private async loadShowList(): Promise<void> {
    const shows: string[] = [];
    for await (const [name, handle] of this.dirHandle!.entries()) {
      if (handle.kind === 'directory') {
        shows.push(name);
      }
    }
    shows.sort(naturalCompare);
    this.shows.set(shows);
  }

  async selectShow(name: string): Promise<void> {
    this.errorMessage.set('');
    this.viewState.set('loading-show');

    try {
      this.showDirHandle = await this.dirHandle!.getDirectoryHandle(name);
      this.selectedShowName.set(name);
      this.folderHandleStack = [this.showDirHandle];
      this.folderPathSegments.set([]);
      await this.loadHistory();
      await this.loadCurrentFolderContents();
      this.viewState.set('browsing');
    } catch {
      this.errorMessage.set(`Unable to read "${name}".`);
      this.viewState.set('show-list');
    }
  }

  async enterSubfolder(name: string): Promise<void> {
    this.errorMessage.set('');

    try {
      const handle = await this.currentDirHandle!.getDirectoryHandle(name);
      this.folderHandleStack.push(handle);
      this.folderPathSegments.update((segments) => [...segments, name]);
      await this.loadCurrentFolderContents();
    } catch {
      this.errorMessage.set(`Unable to open "${name}".`);
    }
  }

  goUpOneLevel(): void {
    if (this.folderPathSegments().length === 0) return;
    this.folderHandleStack.pop();
    this.folderPathSegments.update((segments) => segments.slice(0, -1));
    this.loadCurrentFolderContents();
  }

  private async loadCurrentFolderContents(): Promise<void> {
    this.browseGeneration += 1;
    const generation = this.browseGeneration;
    this.revokeThumbnailUrls();

    const subfolders: string[] = [];
    const episodes: string[] = [];

    for await (const [name, handle] of this.currentDirHandle!.entries()) {
      if (handle.kind === 'directory') {
        if (name !== THUMBNAIL_DIR_NAME) subfolders.push(name);
      } else if (name.toLowerCase().endsWith('.mp4') && name !== HISTORY_FILE_NAME) {
        episodes.push(name);
      }
    }

    subfolders.sort(naturalCompare);
    episodes.sort(naturalCompare);
    this.subfolders.set(subfolders);
    this.episodes.set(episodes);

    const dirHandle = this.currentDirHandle;
    const showHandle = this.showDirHandle;
    const pathSegments = this.folderPathSegments();
    if (dirHandle && showHandle && episodes.length > 0) {
      this.generateThumbnailsForFolder(
        generation,
        dirHandle,
        showHandle,
        episodes,
        pathSegments,
      ).catch(() => {});
    }
  }

  private async loadHistory(): Promise<void> {
    try {
      const fileHandle = await this.showDirHandle!.getFileHandle(HISTORY_FILE_NAME, {
        create: false,
      });
      const file = await fileHandle.getFile();
      const parsed = JSON.parse(await file.text());
      this.history.set(isValidHistory(parsed) ? parsed : {});
    } catch {
      this.history.set({});
    }
  }

  progressTextFor(name: string): string {
    const entry = this.history()[this.relativeKeyFor(name)];
    if (!entry || entry.durationSeconds <= 0) return '';
    if (entry.completed) return 'Watched';
    return `${formatDuration(entry.lastPositionSeconds)} / ${formatDuration(entry.durationSeconds)}`;
  }

  private async generateThumbnailsForFolder(
    generation: number,
    dirHandle: FileSystemDirectoryHandle,
    showHandle: FileSystemDirectoryHandle,
    episodeNames: string[],
    pathSegments: string[],
  ): Promise<void> {
    let nextIndex = 0;
    const take = () => nextIndex++;

    const worker = async (): Promise<void> => {
      for (let i = take(); i < episodeNames.length; i = take()) {
        if (generation !== this.browseGeneration) return;
        const name = episodeNames[i];
        const relativeKey = [...pathSegments, name].join('/');
        await this.ensureThumbnail(generation, dirHandle, showHandle, name, relativeKey);
      }
    };

    const workerCount = Math.min(THUMBNAIL_CONCURRENCY, episodeNames.length);
    await Promise.all(Array.from({ length: workerCount }, worker));
  }

  private async ensureThumbnail(
    generation: number,
    dirHandle: FileSystemDirectoryHandle,
    showHandle: FileSystemDirectoryHandle,
    name: string,
    relativeKey: string,
  ): Promise<void> {
    const cacheFileName = `${relativeKey.replace(/\//g, '__')}.jpg`;

    try {
      const thumbsDir = await showHandle.getDirectoryHandle(THUMBNAIL_DIR_NAME, { create: false });
      const cacheHandle = await thumbsDir.getFileHandle(cacheFileName, { create: false });
      const cacheFile = await cacheHandle.getFile();
      this.applyThumbnailUrl(generation, relativeKey, URL.createObjectURL(cacheFile));
      return;
    } catch {
      // Not cached yet — generate it below.
    }

    let blob: Blob | null;
    try {
      const fileHandle = await dirHandle.getFileHandle(name);
      const file = await fileHandle.getFile();
      blob = await captureVideoFrame(file);
    } catch {
      return;
    }
    if (!blob) return;

    this.applyThumbnailUrl(generation, relativeKey, URL.createObjectURL(blob));

    try {
      const thumbsDir = await showHandle.getDirectoryHandle(THUMBNAIL_DIR_NAME, { create: true });
      const cacheHandle = await thumbsDir.getFileHandle(cacheFileName, { create: true });
      const writable = await cacheHandle.createWritable();
      await writable.write(blob);
      await writable.close();
    } catch {
      // Couldn't persist the cache — the thumbnail still shows for this session, it just regenerates next visit.
    }
  }

  private applyThumbnailUrl(generation: number, relativeKey: string, url: string): void {
    if (generation !== this.browseGeneration) {
      URL.revokeObjectURL(url);
      return;
    }
    this.thumbnailObjectUrls.push(url);
    this.thumbnailUrls.update((current) => ({ ...current, [relativeKey]: url }));
  }

  private revokeThumbnailUrls(): void {
    for (const url of this.thumbnailObjectUrls) {
      URL.revokeObjectURL(url);
    }
    this.thumbnailObjectUrls = [];
    this.thumbnailUrls.set({});
  }

  async selectEpisode(name: string): Promise<void> {
    this.errorMessage.set('');

    try {
      const fileHandle = await this.currentDirHandle!.getFileHandle(name);
      const file = await fileHandle.getFile();
      this.revokeCurrentObjectUrl();
      const url = URL.createObjectURL(file);
      this.currentObjectUrl = url;
      this.selectedEpisodeFileName.set(name);
      this.videoSrc.set(url);
      this.lastProgressSaveAt = 0;
      this.viewState.set('playing');
    } catch {
      this.errorMessage.set(`Could not open "${name}".`);
    }
  }

  private adjacentEpisodeName(offset: number): string | null {
    const list = this.episodes();
    const index = list.indexOf(this.selectedEpisodeFileName() ?? '');
    if (index === -1) return null;
    const adjacentIndex = index + offset;
    return adjacentIndex >= 0 && adjacentIndex < list.length ? list[adjacentIndex] : null;
  }

  previousEpisode(): void {
    const name = this.adjacentEpisodeName(-1);
    if (name) this.selectEpisode(name);
  }

  nextEpisode(): void {
    const name = this.adjacentEpisodeName(1);
    if (name) this.selectEpisode(name);
  }

  onToggleAutoNext(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.autoNext.set(checked);
    try {
      localStorage.setItem(AUTO_NEXT_STORAGE_KEY, checked ? '1' : '0');
    } catch {
      // Preference just won't persist across sessions — not worth surfacing to the user.
    }
  }

  onLoadedMetadata(event: Event): void {
    const video = event.target as HTMLVideoElement;
    const key = this.selectedEpisodeKey();
    const entry = key ? this.history()[key] : undefined;
    if (entry && !entry.completed && entry.lastPositionSeconds > 0) {
      video.currentTime = entry.lastPositionSeconds;
    }
  }

  onTimeUpdate(event: Event): void {
    const now = Date.now();
    if (now - this.lastProgressSaveAt < 5000) return;
    this.lastProgressSaveAt = now;
    const video = event.target as HTMLVideoElement;
    this.recordProgress(video.currentTime, video.duration, false);
    this.persistHistory();
  }

  onPause(event: Event): void {
    const video = event.target as HTMLVideoElement;
    this.recordProgress(video.currentTime, video.duration, false);
    this.persistHistory();
  }

  onEnded(event: Event): void {
    const video = event.target as HTMLVideoElement;
    this.recordProgress(video.duration, video.duration, true);
    this.persistHistory().then(() => {
      if (this.autoNext()) {
        this.nextEpisode();
      }
    });
  }

  private recordProgress(position: number, duration: number, completed: boolean): void {
    const key = this.selectedEpisodeKey();
    if (!key) return;
    const entry: EpisodeHistoryEntry = {
      lastPositionSeconds: Math.floor(position || 0),
      durationSeconds: Math.floor(duration || 0),
      completed,
      lastWatchedAt: new Date().toISOString(),
    };
    this.history.update((current) => ({ ...current, [key]: entry }));
  }

  private async persistHistory(): Promise<void> {
    if (!this.showDirHandle) return;
    try {
      const fileHandle = await this.showDirHandle.getFileHandle(HISTORY_FILE_NAME, {
        create: true,
      });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(this.history(), null, 2));
      await writable.close();
      this.saveWarning.set('');
    } catch {
      this.saveWarning.set(
        'Watch progress could not be saved to history.json (permission may have been denied).',
      );
    }
  }

  private revokeCurrentObjectUrl(): void {
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = null;
    }
  }

  backToBrowsing(): void {
    this.revokeCurrentObjectUrl();
    this.videoSrc.set(null);
    this.selectedEpisodeFileName.set(null);
    this.viewState.set('browsing');
  }

  backToShowList(): void {
    this.revokeCurrentObjectUrl();
    this.browseGeneration += 1;
    this.revokeThumbnailUrls();
    this.videoSrc.set(null);
    this.selectedEpisodeFileName.set(null);
    this.showDirHandle = null;
    this.selectedShowName.set(null);
    this.folderHandleStack = [];
    this.folderPathSegments.set([]);
    this.subfolders.set([]);
    this.episodes.set([]);
    this.history.set({});
    this.viewState.set('show-list');
  }

  chooseDifferentFolder(): void {
    this.revokeCurrentObjectUrl();
    this.browseGeneration += 1;
    this.revokeThumbnailUrls();
    this.dirHandle = null;
    this.hasFolder.set(false);
    this.shows.set([]);
    this.showDirHandle = null;
    this.selectedShowName.set(null);
    this.folderHandleStack = [];
    this.folderPathSegments.set([]);
    this.subfolders.set([]);
    this.episodes.set([]);
    this.history.set({});
    this.selectedEpisodeFileName.set(null);
    this.videoSrc.set(null);
    this.viewState.set('idle');
  }
}

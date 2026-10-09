import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { modules } from '../../core/data/modules';
import { ModuleGroup } from '../../core/models/Module';

@Component({
  selector: 'app-other-modules-home',
  imports: [RouterLink, DatePipe],
  templateUrl: './other-modules-home.html',
  styleUrl: './other-modules-home.scss',
})
export class OtherModulesHome {
  readonly groups: { label: ModuleGroup; modules: typeof modules }[] = (
    ['Local Folder', 'Finance', 'Japanese'] as ModuleGroup[]
  ).map((label) => ({ label, modules: modules.filter((m) => m.group === label) }));
}

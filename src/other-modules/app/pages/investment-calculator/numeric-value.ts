import { Directive, ElementRef, HostListener, Input, inject } from '@angular/core';

/** Formats a number for a textbox with thousands separators (up to 2 decimals); blank for null/''. */
export function formatNumericInputValue(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const num = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
  if (!Number.isFinite(num)) return String(value);
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/**
 * One-way binds a number into a text input, comma-formatted, without fighting the user's typing.
 * A plain `[value]` binding rewrites the textbox whenever the parsed model value's text differs from
 * what's typed (e.g. "1,5000" → "15000"), which throws the caret to the end mid-edit. This skips
 * writes while the input has focus and re-syncs to the latest model value on blur instead.
 */
@Directive({ selector: 'input[appNumericValue]' })
export class NumericValue {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;

  private latest: number | string | null | undefined = null;

  @Input() set appNumericValue(value: number | string | null | undefined) {
    this.latest = value;
    if (!this.isFocused()) this.write();
  }

  @HostListener('blur')
  onBlur(): void {
    this.write();
  }

  private isFocused(): boolean {
    return typeof document !== 'undefined' && document.activeElement === this.el;
  }

  private write(): void {
    const text = formatNumericInputValue(this.latest);
    if (this.el.value !== text) this.el.value = text;
  }
}

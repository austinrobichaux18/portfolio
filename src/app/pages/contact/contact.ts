import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { HttpClient } from '@angular/common/http';
import { NgxTurnstileModule } from 'ngx-turnstile';

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule, NgxTurnstileModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {
  private readonly fb = inject(FormBuilder);

  private readonly http = inject(HttpClient);

  private readonly functionUrl = 'https://sendcontactemail-7vohdas4fa-uc.a.run.app';

  sending = false;

  submitted = false;

  successMessage = '';

  errorMessage = '';

  turnstileToken = '';

  contactForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],

    email: ['', [Validators.required, Validators.email]],

    message: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(2000)]],
  });

  get f() {
    return this.contactForm.controls;
  }

  onTurnstileSuccess(token: string | null) {
    this.turnstileToken = token ?? '';
  }
  onTurnstileExpired() {
    this.turnstileToken = '';
  }
  submit(): void {
    this.submitted = true;

    this.successMessage = '';

    this.errorMessage = '';

    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();

      return;
    }

    if (!this.turnstileToken) {
      this.errorMessage = 'Please complete the verification check.';

      return;
    }

    this.sending = true;

    const payload = {
      ...this.contactForm.getRawValue(),

      token: this.turnstileToken,
    };

    this.http.post(this.functionUrl, payload).subscribe({
      next: () => {
        this.successMessage = 'Message sent successfully!';

        this.contactForm.reset();

        this.turnstileToken = '';

        this.sending = false;
      },

      error: () => {
        this.errorMessage = 'Unable to send message. Please try again later.';

        this.sending = false;
      },
    });
  }
}

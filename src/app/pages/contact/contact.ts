import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-contact',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './contact.html',
  styleUrl: './contact.scss'
})
export class Contact {

  private readonly fb = inject(FormBuilder);

  submitted = false;

  contactForm = this.fb.group({

    name: [
      '',
      [
        Validators.required,
        Validators.maxLength(100)
      ]
    ],

    email: [
      '',
      [
        Validators.required,
        Validators.email
      ]
    ],

    company: [
      '',
      [
        Validators.maxLength(100)
      ]
    ],

    message: [
      '',
      [
        Validators.required,
        Validators.minLength(20),
        Validators.maxLength(2000)
      ]
    ]

  });

  get f() {
    return this.contactForm.controls;
  }

  submit(): void {

    this.submitted = true;

    if (this.contactForm.invalid) {

      this.contactForm.markAllAsTouched();
      return;

    }

    console.log('Contact Form:', this.contactForm.getRawValue());

    // We'll replace this with the Firebase API call later.

    this.contactForm.reset();

    this.submitted = false;

  }

}

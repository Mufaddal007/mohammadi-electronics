import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  isSignUp = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Form Fields
  signInEmail = '';
  signInPassword = signal('');

  signUpUsername = '';
  signUpFullName = '';
  signUpEmail = '';
  signUpMobile = '';
  signUpPassword = signal('');

  // Blur/Focus Loss Validation States
  signUpEmailError = signal('');
  signUpMobileError = signal('');
  emailStartedTyping = false;
  mobileStartedTyping = false;

  onEmailChange() {
    if (this.signUpEmail.trim().length > 0) {
      this.emailStartedTyping = true;
    }
    this.signUpEmailError.set('');
  }

  onEmailBlur() {
    if (this.emailStartedTyping) {
      const val = this.signUpEmail.trim();
      if (!val) {
        this.signUpEmailError.set('Email is required.');
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
          this.signUpEmailError.set('Please enter a valid email address.');
        }
      }
    }
  }

  onMobileChange() {
    this.signUpMobile = this.signUpMobile.replace(/[^0-9+]/g, '');
    if (this.signUpMobile.trim().length > 0) {
      this.mobileStartedTyping = true;
    }
    this.signUpMobileError.set('');
  }

  onMobileKeyPress(event: KeyboardEvent) {
    // Block non-numeric characters (except '+' prefix)
    if (!/[0-9+]/.test(event.key)) {
      event.preventDefault();
    }
  }

  onMobileBlur() {
    if (this.mobileStartedTyping) {
      const val = this.signUpMobile.trim();
      if (!val) {
        this.signUpMobileError.set('Mobile Number is required.');
      } else {
        const mobileRegex = /^(\+?\d{1,4}[\s-]?)?\d{10}$/;
        if (!mobileRegex.test(val)) {
          this.signUpMobileError.set('Please enter a valid 10-digit mobile number.');
        }
      }
    }
  }

  // Reactive Password Strength for Lamp Animation
  passwordStrength = computed(() => {
    const pwd = this.isSignUp() ? this.signUpPassword() : this.signInPassword();
    if (!pwd) return 0; // Off
    if (pwd.length < 6) return 1; // Weak

    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSymbol = /[^A-Za-z0-9]/.test(pwd);

    if (pwd.length >= 8 && hasUpper && hasNumber && hasSymbol) {
      return 3; // Strong
    }
    return 2; // Medium
  });

  passwordStrengthLabel = computed(() => {
    switch (this.passwordStrength()) {
      case 1: return 'Weak';
      case 2: return 'Medium';
      case 3: return 'Strong';
      default: return 'Empty';
    }
  });

  toggleMode() {
    this.isSignUp.update(val => !val);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.signInPassword.set('');
    this.signUpPassword.set('');
    this.signUpEmailError.set('');
    this.signUpMobileError.set('');
    this.emailStartedTyping = false;
    this.mobileStartedTyping = false;
  }

  onSignIn() {
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService.login(this.signInEmail, this.signInPassword()).subscribe({
      next: () => {
        this.successMessage.set('Logged in successfully!');
        setTimeout(() => {
          if (this.authService.isAdmin()) {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/']);
          }
        }, 1000);
      },
      error: (err) => {
        this.errorMessage.set(err.message || 'Incorrect username or password');
      }
    });
  }

  onSignUp() {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.signUpUsername.trim()) {
      this.errorMessage.set('Username is required.');
      return;
    }
    if (!this.signUpFullName.trim()) {
      this.errorMessage.set('Full Name is required.');
      return;
    }
    // Force blur checks on submission
    this.emailStartedTyping = true;
    this.mobileStartedTyping = true;
    this.onEmailBlur();
    this.onMobileBlur();

    if (this.signUpEmailError()) {
      this.errorMessage.set(this.signUpEmailError());
      return;
    }
    if (this.signUpMobileError()) {
      this.errorMessage.set(this.signUpMobileError());
      return;
    }
    if (!this.signUpPassword().trim()) {
      this.errorMessage.set('Password is required.');
      return;
    }

    this.authService.signUp({
      username: this.signUpUsername.trim(),
      full_name: this.signUpFullName.trim(),
      email: this.signUpEmail.trim(),
      password: this.signUpPassword(),
      mobile_number: this.signUpMobile.trim()
    }).subscribe({
      next: () => {
        this.successMessage.set('User registered successfully! Logging you in...');
        
        // Auto-login on success
        this.authService.login(this.signUpUsername.trim(), this.signUpPassword()).subscribe({
          next: () => {
            setTimeout(() => {
              this.router.navigate(['/']);
            }, 1200);
          },
          error: (err) => {
            this.errorMessage.set('Account registered, but login failed: ' + err.message);
          }
        });
      },
      error: (err) => {
        this.errorMessage.set(err.message || 'Registration failed.');
      }
    });
  }
}

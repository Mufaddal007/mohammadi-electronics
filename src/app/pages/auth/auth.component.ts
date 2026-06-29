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
    if (!this.signUpEmail.trim()) {
      this.errorMessage.set('Email is required.');
      return;
    }
    if (!this.signUpMobile.trim()) {
      this.errorMessage.set('Mobile Number is required.');
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

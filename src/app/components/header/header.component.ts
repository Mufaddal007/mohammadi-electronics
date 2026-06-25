import { Component, signal, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  isMenuOpen = signal(false);
  currentUser = computed(() => {
    const name = this.authService.currentUserUsername();
    const role = this.authService.currentUserRole();
    return name ? { name, role } : null;
  });

  navItems = [
    { label: 'Products', path: '/', exact: true },
    { label: 'Load Calculator', path: '/calculator' },
    { label: 'Raise Enquiry', path: '/enquiry' },
    { label: 'Sourcing Request', path: '/product-request' },
    { label: 'Feedback', path: '/feedback' },
    { label: 'About Store', path: '/about' },
    { label: 'Contact', path: '/contact' }
  ];

  toggleMenu() {
    this.isMenuOpen.update(val => !val);
  }

  closeMenu() {
    this.isMenuOpen.set(false);
  }

  logout() {
    this.authService.signOut();
    this.closeMenu();
    this.router.navigate(['/']);
  }
}

import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { AdminSidebarComponent } from './components/admin-sidebar/admin-sidebar.component';
import { LoadingService } from './services/loading.service';
import { ErrorComponent } from './components/error/error.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    HeaderComponent, 
    FooterComponent, 
    AdminSidebarComponent,
    ErrorComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class App {
  private router = inject(Router);
  private loadingService = inject(LoadingService);

  isAdminMode = signal(false);
  isLoading = this.loadingService.isLoading;

  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.isAdminMode.set(event.urlAfterRedirects.startsWith('/admin'));
    });
  }
}

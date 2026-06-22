import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { MockDataService } from './services/mock-data.service';

const adminGuard = () => {
  const auth = inject(MockDataService);
  const router = inject(Router);
  const user = auth.currentUserValue();
  if (user && user.role === 'admin') {
    return true;
  }
  router.navigate(['/login']);
  return false;
};

export const routes: Routes = [
  // Customer facing pages
  {
    path: '',
    loadComponent: () => import('./pages/catalog/catalog.component').then(m => m.CatalogComponent),
    title: 'Mohammadi Electronics - Product Catalog'
  },
  {
    path: 'enquiry',
    loadComponent: () => import('./pages/enquiry/enquiry.component').then(m => m.EnquiryComponent),
    title: 'Raise Service Request | Enquiry'
  },
  {
    path: 'feedback',
    loadComponent: () => import('./pages/feedback/feedback.component').then(m => m.FeedbackComponent),
    title: 'Share Feedback'
  },
  {
    path: 'calculator',
    loadComponent: () => import('./pages/calculator/calculator.component').then(m => m.CalculatorComponent),
    title: 'Smart Home Load Calculator'
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent),
    title: 'About Us & Gallery'
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent),
    title: 'Contact Us'
  },
  {
    path: 'product-request',
    loadComponent: () => import('./pages/product-request/product-request.component').then(m => m.ProductRequestComponent),
    title: 'Request Sourcing | Special Order'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/auth.component').then(m => m.AuthComponent),
    title: 'Sign In / Sign Up - Mohammadi Electronics'
  },

  // Admin section
  {
    path: 'admin',
    redirectTo: 'admin/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./pages/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    title: 'Admin - Statistics Dashboard',
    canActivate: [adminGuard]
  },
  {
    path: 'admin/inventory',
    loadComponent: () => import('./pages/admin-inventory/admin-inventory.component').then(m => m.AdminInventoryComponent),
    title: 'Admin - Inventory Management',
    canActivate: [adminGuard]
  },
  {
    path: 'admin/enquiries',
    loadComponent: () => import('./pages/admin-enquiries/admin-enquiries.component').then(m => m.AdminEnquiriesComponent),
    title: 'Admin - Service Requests',
    canActivate: [adminGuard]
  },
  {
    path: 'admin/feedbacks',
    loadComponent: () => import('./pages/admin-feedbacks/admin-feedbacks.component').then(m => m.AdminFeedbacksComponent),
    title: 'Admin - Feedback Logs',
    canActivate: [adminGuard]
  },

  // Fallback
  {
    path: '**',
    redirectTo: ''
  }
];


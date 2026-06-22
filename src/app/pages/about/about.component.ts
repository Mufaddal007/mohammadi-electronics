import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface GalleryItem {
  title: string;
  category: string;
  imgUrl: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent {
  galleryItems: GalleryItem[] = [
    {
      title: 'Store Outlet at Bedwa Road',
      category: 'Storefront',
      imgUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&auto=format&fit=crop&q=60'
    },
    {
      title: 'Livguard Tubular Batteries',
      category: 'Inventory Stock',
      imgUrl: 'https://images.unsplash.com/photo-1548345680-f5475ea5df84?w=500&auto=format&fit=crop&q=60'
    },
    {
      title: 'High-Efficiency Cooler Racks',
      category: 'Seasonal Displays',
      imgUrl: 'https://images.unsplash.com/photo-1618944913480-b67ee16d7b77?w=500&auto=format&fit=crop&q=60'
    },
    {
      title: 'Battery Diagnostic Station',
      category: 'Service Laboratory',
      imgUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60'
    }
  ];

  serviceableLocations: string[] = [
    'Bedwa',
    'Garhi',
    'Pipalkhunt',
    'Ghatol',
    'Danpur',
    'Chhinch',
    'Talwara',
    'Sabla',
    'Sagwara',
    'Khodra'
  ];

  onImgError(event: any) {
    event.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="225" viewBox="0 0 300 225"><rect width="100%" height="100%" fill="%230b1329"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2314b8a6" font-family="monospace" font-size="12">Mohammadi Electronics</text></svg>';
  }
}

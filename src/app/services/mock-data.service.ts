import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface User {
  email: string;
  name: string;
  role: 'admin' | 'user';
  password?: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string; // 'Inverters' | 'Batteries' | 'Coolers' | 'Fans' | 'Stabilizers' | 'Spares'
  price: number;
  specifications: string[];
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock';
  quantity: number;
  imageUrl: string;
}

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  applianceType: string;
  issueDescription: string;
  date: string;
  status: 'Pending' | 'Resolved';
}

export interface Feedback {
  id: string;
  name?: string;
  rating: number;
  comments: string;
  date: string;
}

export interface ProductRequest {
  id: string;
  name: string;
  phone: string;
  productName: string;
  brand: string;
  description: string;
  contactMethod: 'Call' | 'WhatsApp' | 'Email';
  date: string;
  status: 'Pending' | 'Sourced' | 'Unobtainable';
}

@Injectable({
  providedIn: 'root',
})
export class MockDataService {
  private initialUsers: User[] = [
    { email: 'admin@mohammadi.com', name: 'Admin Staff', role: 'admin', password: 'admin123' },
    { email: 'user@example.com', name: 'John Doe', role: 'user', password: 'user123' }
  ];

  private users = signal<User[]>(this.getLocalStorage('users', this.initialUsers));
  currentUser = signal<User | null>(this.getLocalStorage('currentUser', null));

  currentUserValue() {
    return this.currentUser();
  }

  // Initial Mock Products
  private initialProducts: Product[] = [
    {
      id: 'prod-1',
      name: 'Livguard Super 1100 Inverter',
      brand: 'Livguard',
      category: 'Inverters',
      price: 6800,
      specifications: ['Capacity: 900 VA', 'Sine Wave Output', 'Smart AI Charging', '3 Years Warranty'],
      stockStatus: 'in-stock',
      quantity: 12,
      imageUrl: 'https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=500&auto=format&fit=crop&q=60' // generic sleek power icon/box
    },
    {
      id: 'prod-2',
      name: 'Microtek Merlyn 1250 Smart',
      brand: 'Microtek',
      category: 'Inverters',
      price: 7400,
      specifications: ['Capacity: 1125 VA', 'Digital Display', 'Overload Protection', '2 Years Warranty'],
      stockStatus: 'in-stock',
      quantity: 8,
      imageUrl: 'https://images.unsplash.com/photo-1617791160505-6f006e121980?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 'prod-3',
      name: 'Livguard IT 1560ST Short Tall Battery',
      brand: 'Livguard',
      category: 'Batteries',
      price: 13500,
      specifications: ['Capacity: 150 Ah', 'Tubular Technology', 'Extra Backup Time', '60 Months Warranty'],
      stockStatus: 'in-stock',
      quantity: 15,
      imageUrl: 'https://images.unsplash.com/photo-1548345680-f5475ea5df84?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 'prod-4',
      name: 'Genus Hallabol 200Ah Battery',
      brand: 'Genus',
      category: 'Batteries',
      price: 16200,
      specifications: ['Capacity: 200 Ah', 'Heavy Duty Tubular', 'Ultra Low Maintenance', '72 Months Warranty'],
      stockStatus: 'low-stock',
      quantity: 3,
      imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 'prod-5',
      name: 'Elenkay Desert Force Cooler',
      brand: 'Elenkay',
      category: 'Coolers',
      price: 9500,
      specifications: ['Capacity: 75 Litres', 'Honeycomb Cooling Pads', 'High Air Delivery', 'Powerful 3-Speed Motor'],
      stockStatus: 'in-stock',
      quantity: 10,
      imageUrl: 'https://images.unsplash.com/photo-1618944913480-b67ee16d7b77?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 'prod-6',
      name: 'Crompton SilentPro Enso Fan',
      brand: 'Crompton',
      category: 'Fans',
      price: 3400,
      specifications: ['Size: 1200 mm', 'ActivBLDC Energy Saving Motor', 'Super Silent Operation (52dB)', 'Remote Control Included'],
      stockStatus: 'in-stock',
      quantity: 20,
      imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 'prod-7',
      name: 'Fortuners Premium High-Speed Fan',
      brand: 'Fortuners',
      category: 'Fans',
      price: 1950,
      specifications: ['Size: 1200 mm', 'High-Speed Copper Motor (400 RPM)', 'Aerodynamic Blades', 'Rust-Proof Powder Coating'],
      stockStatus: 'in-stock',
      quantity: 25,
      imageUrl: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 'prod-8',
      name: 'Microtek EM4160 Stabilizer',
      brand: 'Microtek',
      category: 'Stabilizers',
      price: 2450,
      specifications: ['Working Range: 160V - 285V', 'For AC up to 1.5 Ton', 'Digital Display', 'Wall Mountable Design'],
      stockStatus: 'in-stock',
      quantity: 7,
      imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 'prod-9',
      name: 'Genus Carbon 1500 Home UPS',
      brand: 'Genus',
      category: 'Inverters',
      price: 8900,
      specifications: ['Capacity: 1250 VA', 'DSP Pure Sine Wave', 'Solar Compatible Dual Mode', '2 Years Warranty'],
      stockStatus: 'out-of-stock',
      quantity: 0,
      imageUrl: 'https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=500&auto=format&fit=crop&q=60'
    }
  ];

  // Initial Mock Enquiries
  private initialEnquiries: Enquiry[] = [
    {
      id: 'enq-1',
      name: 'Rajesh Sharma',
      phone: '+91-9876543210',
      applianceType: 'Inverter & Battery',
      issueDescription: 'Livguard battery is discharging very quickly. Needs inspection and backup testing.',
      date: '2026-06-20T10:30:00.000Z',
      status: 'Pending'
    },
    {
      id: 'enq-2',
      name: 'Sunita Vyas',
      phone: '+91-7597518425',
      applianceType: 'Desert Cooler',
      issueDescription: 'Elenkay cooler water pump is not working. Requesting replacement pump installation.',
      date: '2026-06-19T14:15:00.000Z',
      status: 'Resolved'
    }
  ];

  // Initial Mock Feedbacks
  private initialFeedbacks: Feedback[] = [
    {
      id: 'fb-1',
      name: 'Vikram Singh',
      rating: 5,
      comments: 'Excellent service at Bedwa Road. Got a Microtek stabilizer fixed within an hour! Highly recommended store in Partapur.',
      date: '2026-06-20T16:45:00.000Z'
    },
    {
      id: 'fb-2',
      name: 'Amit Patel',
      rating: 4,
      comments: 'Prices for Livguard batteries are very competitive. It would be great if you could list more spare parts on your catalog.',
      date: '2026-06-18T11:00:00.000Z'
    }
  ];

  // Initial Mock Product Requests
  private initialProductRequests: ProductRequest[] = [
    {
      id: 'req-1',
      name: 'Gopal Lal',
      phone: '+91-9413282752',
      productName: 'Genus Carbon 1500 Solar UPS',
      brand: 'Genus',
      description: 'Need a specific solar inverter with MPPT charger, not available locally in Partapur.',
      contactMethod: 'Call',
      date: '2026-06-21T09:00:00.000Z',
      status: 'Pending'
    }
  ];

  // BehaviorSubjects for state preservation
  private productsSubject = new BehaviorSubject<Product[]>(this.getLocalStorage('products', this.initialProducts));
  private enquiriesSubject = new BehaviorSubject<Enquiry[]>(this.getLocalStorage('enquiries', this.initialEnquiries));
  private feedbacksSubject = new BehaviorSubject<Feedback[]>(this.getLocalStorage('feedbacks', this.initialFeedbacks));
  private productRequestsSubject = new BehaviorSubject<ProductRequest[]>(this.getLocalStorage('productRequests', this.initialProductRequests));

  constructor() {}

  // LocalStorage Helper for persistence during demo reload
  private getLocalStorage<T>(key: string, defaultValue: T): T {
    try {
      const saved = localStorage.getItem(`mohammadi_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setLocalStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`mohammadi_${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }

  // --- Products State Management ---
  getProducts(): Observable<Product[]> {
    return this.productsSubject.asObservable();
  }

  getProductById(id: string): Product | undefined {
    return this.productsSubject.value.find(p => p.id === id);
  }

  addProduct(product: Omit<Product, 'id'>): void {
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`
    };
    const updated = [...this.productsSubject.value, newProduct];
    this.productsSubject.next(updated);
    this.setLocalStorage('products', updated);
  }

  updateProduct(updatedProduct: Product): void {
    const updated = this.productsSubject.value.map(p => 
      p.id === updatedProduct.id ? updatedProduct : p
    );
    this.productsSubject.next(updated);
    this.setLocalStorage('products', updated);
  }

  deleteProduct(id: string): void {
    const updated = this.productsSubject.value.filter(p => p.id !== id);
    this.productsSubject.next(updated);
    this.setLocalStorage('products', updated);
  }

  // --- Enquiries State Management ---
  getEnquiries(): Observable<Enquiry[]> {
    return this.enquiriesSubject.asObservable();
  }

  addEnquiry(enquiry: Omit<Enquiry, 'id' | 'date' | 'status'>): void {
    const newEnquiry: Enquiry = {
      ...enquiry,
      id: `enq-${Date.now()}`,
      date: new Date().toISOString(),
      status: 'Pending'
    };
    const updated = [newEnquiry, ...this.enquiriesSubject.value];
    this.enquiriesSubject.next(updated);
    this.setLocalStorage('enquiries', updated);
  }

  toggleEnquiryStatus(id: string): void {
    const updated = this.enquiriesSubject.value.map(e => {
      if (e.id === id) {
        const newStatus: 'Pending' | 'Resolved' = e.status === 'Pending' ? 'Resolved' : 'Pending';
        return { ...e, status: newStatus };
      }
      return e;
    });
    this.enquiriesSubject.next(updated);
    this.setLocalStorage('enquiries', updated);
  }

  // --- Feedbacks State Management ---
  getFeedbacks(): Observable<Feedback[]> {
    return this.feedbacksSubject.asObservable();
  }

  addFeedback(feedback: Omit<Feedback, 'id' | 'date'>): void {
    const newFeedback: Feedback = {
      ...feedback,
      id: `fb-${Date.now()}`,
      date: new Date().toISOString()
    };
    const updated = [newFeedback, ...this.feedbacksSubject.value];
    this.feedbacksSubject.next(updated);
    this.setLocalStorage('feedbacks', updated);
  }

  // --- Analytics & Statistics Summary ---
  getStats(): Observable<{
    totalProducts: number;
    totalEnquiries: number;
    pendingEnquiries: number;
    averageRating: number;
    mostPopularCategory: string;
  }> {
    return this.productsSubject.pipe(
      map(products => {
        const enquiries = this.enquiriesSubject.value;
        const feedbacks = this.feedbacksSubject.value;

        // Calculate most popular/searched category (mock proxy by count of products)
        const categoryCounts = products.reduce((acc, curr) => {
          acc[curr.category] = (acc[curr.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        let mostPopularCategory = 'Inverters';
        let maxCount = 0;
        for (const [cat, count] of Object.entries(categoryCounts)) {
          if (count > maxCount) {
            maxCount = count;
            mostPopularCategory = cat;
          }
        }

        // Calculate average rating
        const totalRating = feedbacks.reduce((acc, curr) => acc + curr.rating, 0);
        const averageRating = feedbacks.length > 0 ? parseFloat((totalRating / feedbacks.length).toFixed(1)) : 5.0;

        return {
          totalProducts: products.length,
          totalEnquiries: enquiries.length,
          pendingEnquiries: enquiries.filter(e => e.status === 'Pending').length,
          averageRating,
          mostPopularCategory
        };
      })
    );
  }

  signIn(email: string, password: string): { success: boolean; message: string } {
    const emailLower = email.toLowerCase().trim();
    const user = this.users().find(u => u.email.toLowerCase() === emailLower && u.password === password);
    if (user) {
      const loggedInUser: User = { email: user.email, name: user.name, role: user.role };
      this.currentUser.set(loggedInUser);
      this.setLocalStorage('currentUser', loggedInUser);
      return { success: true, message: 'Logged in successfully!' };
    }
    return { success: false, message: 'Invalid email or password.' };
  }

  signUp(email: string, password: string, name: string): { success: boolean; message: string } {
    const emailLower = email.toLowerCase().trim();
    if (this.users().some(u => u.email.toLowerCase() === emailLower)) {
      return { success: false, message: 'Email already registered.' };
    }
    
    const newUser: User = {
      email: emailLower,
      name: name.trim(),
      role: 'user',
      password: password
    };
    
    this.users.update(list => [...list, newUser]);
    this.setLocalStorage('users', this.users());
    
    const loggedInUser: User = { email: newUser.email, name: newUser.name, role: newUser.role };
    this.currentUser.set(loggedInUser);
    this.setLocalStorage('currentUser', loggedInUser);
    
    return { success: true, message: 'Account registered and logged in!' };
  }

  signOut(): void {
    this.currentUser.set(null);
    this.setLocalStorage('currentUser', null);
  }

  // --- Users State Management ---
  getUsersList(): User[] {
    return this.users();
  }

  deleteUser(email: string): { success: boolean; message: string } {
    const targetEmail = email.toLowerCase().trim();
    if (targetEmail === 'admin@mohammadi.com') {
      return { success: false, message: 'Cannot delete the primary admin account.' };
    }
    const current = this.currentUser();
    if (current && current.email.toLowerCase() === targetEmail) {
      return { success: false, message: 'Cannot delete your own active administrator account.' };
    }
    
    this.users.update(list => list.filter(u => u.email.toLowerCase() !== targetEmail));
    this.setLocalStorage('users', this.users());
    return { success: true, message: 'User deleted successfully.' };
  }

  // --- Product Requests State Management ---
  getProductRequests(): Observable<ProductRequest[]> {
    return this.productRequestsSubject.asObservable();
  }

  addProductRequest(request: Omit<ProductRequest, 'id' | 'date' | 'status'>): void {
    const newRequest: ProductRequest = {
      ...request,
      id: `req-${Date.now()}`,
      date: new Date().toISOString(),
      status: 'Pending'
    };
    const updated = [newRequest, ...this.productRequestsSubject.value];
    this.productRequestsSubject.next(updated);
    this.setLocalStorage('productRequests', updated);
  }

  updateProductRequestStatus(id: string, status: ProductRequest['status']): void {
    const updated = this.productRequestsSubject.value.map(r => 
      r.id === id ? { ...r, status } : r
    );
    this.productRequestsSubject.next(updated);
    this.setLocalStorage('productRequests', updated);
  }
}

import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService, SmartHomeQuery } from '../../services/mock-data.service';
import { ProductService } from '../../services/product.service';
import { ProductCatalogItem } from '../../models/product.model';

@Component({
  selector: 'app-admin-smart-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-smart-home.component.html',
  styleUrl: './admin-smart-home.component.css'
})
export class AdminSmartHomeComponent implements OnInit {
  private mockDataService = inject(MockDataService);
  private productService = inject(ProductService);

  queriesList = signal<SmartHomeQuery[]>([]);
  productsList = signal<ProductCatalogItem[]>([]);
  searchQuery = signal<string>('');
  
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  // Selected query to respond to
  selectedQuery = signal<SmartHomeQuery | null>(null);

  // Response form inputs
  responseType = signal<'existing_solution' | 'custom_explanation'>('existing_solution');
  selectedProductId = signal<string>('');
  customDetailsText = signal<string>('');

  ngOnInit() {
    this.loadQueries();
    this.loadProducts();
  }

  loadQueries() {
    this.mockDataService.getSmartHomeQueries().subscribe({
      next: (queries) => {
        this.queriesList.set(queries);
      }
    });
  }

  loadProducts() {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.productsList.set(products);
        if (products.length > 0) {
          this.selectedProductId.set(String(products[0].id));
        }
      }
    });
  }

  openResponseModal(query: SmartHomeQuery) {
    this.selectedQuery.set(query);
    this.responseType.set('existing_solution');
    this.customDetailsText.set('');
    
    if (this.productsList().length > 0) {
      this.selectedProductId.set(String(this.productsList()[0].id));
    } else {
      this.selectedProductId.set('');
    }
  }

  closeResponseModal() {
    this.selectedQuery.set(null);
    this.customDetailsText.set('');
    this.selectedProductId.set('');
  }

  getProductBrand(prod: ProductCatalogItem): string {
    const brandSpec = prod.specs?.find(s => s.spec_key.toLowerCase() === 'brand');
    return brandSpec ? brandSpec.spec_value : (prod.name.split(' ')[0] || 'Generic');
  }

  submitResponse() {
    const query = this.selectedQuery();
    if (!query) return;

    let finalDetails = '';
    if (this.responseType() === 'existing_solution') {
      const prodId = Number(this.selectedProductId());
      const product = this.productsList().find(p => p.id === prodId);
      if (!product) {
        alert('Invalid product selected.');
        return;
      }
      const brand = this.getProductBrand(product);
      finalDetails = `We suggest our product: "${product.name}" (${brand}). \n\nIt is available in our catalog at ₹${product.price.toLocaleString('en-IN')}. This aligns perfectly with your requirements for ${query.areaOfInterest}. Our team will contact you at ${query.phone} to demonstrate this solution!`;
    } else {
      if (!this.customDetailsText().trim()) {
        alert('Please fill out the custom DIY guidance explanation details.');
        return;
      }
      finalDetails = this.customDetailsText().trim();
    }

    const responsePayload = {
      type: this.responseType(),
      solutionDetails: finalDetails
    };

    this.mockDataService.respondToSmartHomeQuery(query.id, responsePayload);

    this.successMessage.set('Response submitted successfully!');
    this.closeResponseModal();
    this.loadQueries();

    setTimeout(() => this.successMessage.set(''), 4000);
  }

  filteredQueries = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const list = this.queriesList();
    if (!query) return list;

    return list.filter(q => 
      q.customerName.toLowerCase().includes(query) ||
      q.areaOfInterest.toLowerCase().includes(query) ||
      q.homeType.toLowerCase().includes(query) ||
      q.problemStatement.toLowerCase().includes(query)
    );
  });
}

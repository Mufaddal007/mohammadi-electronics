import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService, Product } from '../../services/mock-data.service';
import { ProductService } from '../../services/product.service';
import { ProductSaveRequest, ProductCatalogItem, ProductSpec, getCategoryId, getCategoryNameById } from '../../models/product.model';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-inventory.component.html',
  styleUrl: './admin-inventory.component.css'
})
export class AdminInventoryComponent implements OnInit {
  private dataService = inject(MockDataService);
  private productService = inject(ProductService);

  products = signal<Product[]>([]);
  showForm = signal(false);
  isEditing = signal(false);
  editingId: string | null = null;
  rawSpecs = '';
  uploading = signal(false);

  // Excel bulk import state
  excelProducts = signal<any[]>([]);
  showExcelPreview = signal(false);
  savingExcel = signal(false);

  // Search & Bulk action state
  searchQuery = signal('');
  selectedProductIds = signal<string[]>([]);

  // Progress states
  importProgress = signal(0);
  importTotal = signal(0);

  deletingBulk = signal(false);
  deleteProgress = signal(0);
  deleteTotal = signal(0);

  filteredProducts = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.products();
    return this.products().filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.brand.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );
  });

  formData = {
    name: '',
    brand: '',
    category: '',
    price: 0,
    quantity: 0,
    stockStatus: 'in-stock' as Product['stockStatus'],
    imageUrl: ''
  };

  ngOnInit() {
    this.loadProducts();
  }

  resolveImageUrl(url: string | undefined | null): string {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${this.productService.domain}/${url}`;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    
    // Validate file type
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      alert('Unsupported file type. Allowed types: .jpg, .jpeg, .png, .webp');
      return;
    }

    this.uploading.set(true);
    this.productService.uploadProductImage(file).subscribe({
      next: (res) => {
        this.uploading.set(false);
        if (res && res.relative_url) {
          this.formData.imageUrl = res.relative_url;
        }
      },
      error: (err) => {
        this.uploading.set(false);
        alert('Upload failed: ' + err.message);
      }
    });
  }

  onExcelFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Parse rows as raw array of objects
        const rawRows = XLSX.utils.sheet_to_json(worksheet) as any[];
        if (rawRows.length === 0) {
          alert('The uploaded Excel sheet is empty.');
          return;
        }

        // Map column keys case-insensitively
        const parsed: any[] = [];
        for (const row of rawRows) {
          let productName = '';
          let brand = '';
          let category = '';
          let specifications = '';
          let price = 0;
          let stock = 1;
          let imageUrl = '';

          for (const key of Object.keys(row)) {
            const normalizedKey = key.trim().toLowerCase();
            if (normalizedKey === 'product name' || normalizedKey === 'name' || normalizedKey.includes('product name') || normalizedKey.includes('name')) {
              productName = String(row[key]);
            } else if (normalizedKey === 'brand') {
              brand = String(row[key]);
            } else if (normalizedKey === 'category') {
              category = String(row[key]);
            } else if (normalizedKey === 'specifications' || normalizedKey === 'specs' || normalizedKey.includes('spec')) {
              specifications = String(row[key]);
            } else if (normalizedKey === 'price' || normalizedKey.includes('price') || normalizedKey.includes('rate')) {
              const cleaned = String(row[key]).replace(/[^0-9.]/g, '');
              price = parseFloat(cleaned) || 0;
            } else if (normalizedKey === 'stock' || normalizedKey === 'quantity' || normalizedKey === 'qty' || normalizedKey.includes('stock') || normalizedKey.includes('qty') || normalizedKey.includes('quantity')) {
              const cleaned = String(row[key]).replace(/[^0-9]/g, '');
              stock = parseInt(cleaned, 10) || 0;
            } else if (normalizedKey === 'image' || normalizedKey === 'image url' || normalizedKey === 'imageurl' || normalizedKey.includes('image') || normalizedKey.includes('url')) {
              imageUrl = String(row[key]);
            }
          }

          if (productName) {
            parsed.push({
              name: productName,
              brand: brand || 'Generic',
              category: category || 'Inverters',
              specifications: specifications,
              price: price,
              quantity: stock,
              imageUrl: imageUrl || ''
            });
          }
        }

        if (parsed.length === 0) {
          alert('Could not find any products. Make sure columns match: Product name, Brand, Category, Specifications');
          return;
        }

        this.excelProducts.set(parsed);
        this.showExcelPreview.set(true);
      } catch (err: any) {
        alert('Failed to read Excel file: ' + err.message);
      } finally {
        input.value = ''; // reset file input selection
      }
    };

    reader.readAsArrayBuffer(file);
  }

  saveExcelProducts() {
    const list = this.excelProducts();
    if (list.length === 0) return;

    this.importTotal.set(list.length);
    this.importProgress.set(0);
    this.savingExcel.set(true);

    const saveNext = (index: number) => {
      this.importProgress.set(index);
      if (index >= list.length) {
        this.savingExcel.set(false);
        this.showExcelPreview.set(false);
        this.excelProducts.set([]);
        this.loadProducts();
        alert('All products imported successfully!');
        return;
      }

      const item = list[index];
      
      const specsArray = item.specifications
        ? item.specifications.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
        : [];
      
      const specsObjArray: ProductSpec[] = specsArray.map((spec: string) => {
        const colonIndex = spec.indexOf(':');
        if (colonIndex > -1) {
          return {
            spec_key: spec.substring(0, colonIndex).trim(),
            spec_value: spec.substring(colonIndex + 1).trim()
          };
        }
        return { spec_key: 'Feature', spec_value: spec };
      });

      const brandSpecIndex = specsObjArray.findIndex(s => s.spec_key.toLowerCase() === 'brand');
      if (brandSpecIndex === -1 && item.brand) {
        specsObjArray.push({ spec_key: 'Brand', spec_value: item.brand.trim() });
      }

      const slug = item.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const payload: ProductSaveRequest = {
        id: null,
        category_id: getCategoryId(item.category),
        name: item.name.trim(),
        slug: slug,
        description: item.name.trim(),
        price: item.price,
        image_url: item.imageUrl || 'https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=500&auto=format&fit=crop&q=60',
        stock_qty: item.quantity,
        low_stock_threshold: 3,
        specs: specsObjArray
      };

      this.productService.saveOrUpdateProduct(payload).subscribe({
        next: () => {
          saveNext(index + 1);
        },
        error: (err) => {
          this.savingExcel.set(false);
          alert(`Failed to import "${item.name}": ${err.message}. Stopped at row ${index + 1}.`);
        }
      });
    };

    saveNext(0);
  }

  loadProducts() {
    this.productService.getProducts().subscribe({
      next: (apiProducts) => {
        const mapped: Product[] = apiProducts.map(p => {
          const brandSpec = p.specs?.find(s => s.spec_key.toLowerCase() === 'brand');
          const brand = brandSpec ? brandSpec.spec_value : (p.name.split(' ')[0] || 'Generic');
          
          const specifications = p.specs?.map(s => `${s.spec_key}: ${s.spec_value}`) || [];
          
          let stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock' = 'in-stock';
          if (p.stock_qty <= 0) {
            stockStatus = 'out-of-stock';
          } else if (p.stock_qty <= p.low_stock_threshold) {
            stockStatus = 'low-stock';
          }

          return {
            id: String(p.id),
            name: p.name,
            brand: brand,
            category: getCategoryNameById(p.category_id),
            price: p.price,
            specifications: specifications,
            stockStatus: stockStatus,
            quantity: p.stock_qty,
            imageUrl: p.image_url
          };
        });
        this.products.set(mapped);
      },
      error: (err) => {
        console.error('Error loading products from REST API', err);
      }
    });
  }

  toggleAddForm() {
    this.showForm.update(val => !val);
    if (!this.showForm()) {
      this.cancelForm();
    }
  }

  onQtyChange(qty: number) {
    if (qty === 0) {
      this.formData.stockStatus = 'out-of-stock';
    } else if (qty <= 3) {
      this.formData.stockStatus = 'low-stock';
    } else {
      this.formData.stockStatus = 'in-stock';
    }
  }

  onSubmit(form: any) {
    if (form.valid) {
      // parse raw specs into clean array
      const specsArray = this.rawSpecs
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      const specsObjArray: ProductSpec[] = specsArray.map(spec => {
        const colonIndex = spec.indexOf(':');
        if (colonIndex > -1) {
          return {
            spec_key: spec.substring(0, colonIndex).trim(),
            spec_value: spec.substring(colonIndex + 1).trim()
          };
        } else {
          return {
            spec_key: 'Feature',
            spec_value: spec
          };
        }
      });

      // Add default specs if brand is not in spec list
      const brandSpecIndex = specsObjArray.findIndex(s => s.spec_key.toLowerCase() === 'brand');
      if (brandSpecIndex === -1 && this.formData.brand) {
        specsObjArray.push({
          spec_key: 'Brand',
          spec_value: this.formData.brand.trim()
        });
      } else if (brandSpecIndex > -1 && this.formData.brand) {
        specsObjArray[brandSpecIndex].spec_value = this.formData.brand.trim();
      }

      const slug = this.formData.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const payload: ProductSaveRequest = {
        id: this.isEditing() && this.editingId ? Number(this.editingId) : null,
        category_id: getCategoryId(this.formData.category),
        name: this.formData.name.trim(),
        slug: slug,
        description: this.formData.name.trim(),
        price: this.formData.price,
        image_url: this.formData.imageUrl.trim() || 'https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=500&auto=format&fit=crop&q=60',
        stock_qty: this.formData.quantity,
        low_stock_threshold: 3,
        specs: specsObjArray
      };

      this.productService.saveOrUpdateProduct(payload).subscribe({
        next: () => {
          this.loadProducts();
          this.cancelForm();
        },
        error: (err) => {
          alert('Failed to save product: ' + err.message);
        }
      });
    }
  }


  editProduct(prod: Product) {
    this.isEditing.set(true);
    this.editingId = prod.id;
    this.rawSpecs = prod.specifications.join(', ');
    
    this.formData = {
      name: prod.name,
      brand: prod.brand,
      category: prod.category,
      price: prod.price,
      quantity: prod.quantity,
      stockStatus: prod.stockStatus,
      imageUrl: prod.imageUrl
    };
    
    this.showForm.set(true);
  }

  deleteProduct(id: string) {
    if (confirm('Are you sure you want to delete this product from the inventory?')) {
      this.productService.deleteProduct(Number(id)).subscribe({
        next: () => {
          this.loadProducts();
        },
        error: (err) => {
          alert('Failed to delete product: ' + err.message);
        }
      });
    }
  }

  cancelForm() {
    this.formData = {
      name: '',
      brand: '',
      category: '',
      price: 0,
      quantity: 0,
      stockStatus: 'in-stock',
      imageUrl: ''
    };
    this.rawSpecs = '';
    this.isEditing.set(false);
    this.editingId = null;
    this.showForm.set(false);
  }

  getStockBadgeClass(status: Product['stockStatus']) {
    switch (status) {
      case 'in-stock':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
      case 'low-stock':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
      case 'out-of-stock':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/25';
    }
  }

  onImgError(event: any) {
    event.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="75" viewBox="0 0 100 75"><rect width="100%" height="100%" fill="%230b1329"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2314b8a6" font-family="monospace" font-size="8">Product</text></svg>';
  }

  isSelected(id: string): boolean {
    return this.selectedProductIds().includes(id);
  }

  toggleSelection(id: string) {
    const current = this.selectedProductIds();
    if (current.includes(id)) {
      this.selectedProductIds.set(current.filter(x => x !== id));
    } else {
      this.selectedProductIds.set([...current, id]);
    }
  }

  toggleAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedProductIds.set(this.filteredProducts().map(p => p.id));
    } else {
      this.selectedProductIds.set([]);
    }
  }

  clearSelection() {
    this.selectedProductIds.set([]);
  }

  bulkDelete() {
    const ids = this.selectedProductIds();
    if (ids.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${ids.length} selected products?`)) return;

    this.deleteTotal.set(ids.length);
    this.deleteProgress.set(0);
    this.deletingBulk.set(true);

    const deleteNext = (index: number) => {
      this.deleteProgress.set(index);
      if (index >= ids.length) {
        this.deletingBulk.set(false);
        this.clearSelection();
        this.loadProducts();
        alert('Bulk deletion completed successfully.');
        return;
      }
      
      const prodId = Number(ids[index]);
      this.productService.deleteProduct(prodId).subscribe({
        next: () => {
          deleteNext(index + 1);
        },
        error: (err) => {
          this.deletingBulk.set(false);
          alert(`Failed to delete product ID ${prodId}: ${err.message}. Stopped bulk execution.`);
          this.loadProducts();
        }
      });
    };

    deleteNext(0);
  }

  bulkMarkOutOfStock() {
    const ids = this.selectedProductIds();
    if (ids.length === 0) return;

    const findAndSaveNext = (index: number) => {
      if (index >= ids.length) {
        this.clearSelection();
        this.loadProducts();
        alert('Selected products marked out of stock successfully.');
        return;
      }

      const selectedId = ids[index];
      const prodObj = this.products().find(p => p.id === selectedId);
      if (!prodObj) {
        findAndSaveNext(index + 1);
        return;
      }

      const specsObjArray: ProductSpec[] = prodObj.specifications.map((spec: string) => {
        const colonIndex = spec.indexOf(':');
        if (colonIndex > -1) {
          return {
            spec_key: spec.substring(0, colonIndex).trim(),
            spec_value: spec.substring(colonIndex + 1).trim()
          };
        }
        return { spec_key: 'Feature', spec_value: spec };
      });

      const payload: ProductSaveRequest = {
        id: Number(prodObj.id),
        category_id: getCategoryId(prodObj.category),
        name: prodObj.name,
        slug: prodObj.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: prodObj.name,
        price: prodObj.price,
        image_url: prodObj.imageUrl,
        stock_qty: 0,
        low_stock_threshold: 3,
        specs: specsObjArray
      };

      this.productService.saveOrUpdateProduct(payload).subscribe({
        next: () => {
          findAndSaveNext(index + 1);
        },
        error: (err) => {
          alert(`Failed to update product "${prodObj.name}": ${err.message}. Stopped bulk execution.`);
          this.loadProducts();
        }
      });
    };

    findAndSaveNext(0);
  }

  downloadTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products Template');

    // Define columns
    worksheet.columns = [
      { header: 'Product name', key: 'name', width: 25 },
      { header: 'Brand', key: 'brand', width: 15 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Specifications', key: 'specs', width: 35 },
      { header: 'Price', key: 'price', width: 12 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'Image', key: 'image', width: 25 }
    ];

    // Add pre-filled mock records
    worksheet.addRow({
      name: 'Livguard Supertek 1100va',
      brand: 'Livguard',
      category: 'Inverters',
      specs: 'Capacity: 900 VA, Warranty: 3 Years, Sine Wave Output',
      price: 6800,
      stock: 10,
      image: 'https://images.unsplash.com/photo-1620288627223-53302f4e8c74'
    });

    worksheet.addRow({
      name: 'Luminous Red Charge RC 18000',
      brand: 'Luminous',
      category: 'Batteries',
      specs: 'Capacity: 150 Ah, Tall Tubular Battery, Warranty: 36 Months',
      price: 12500,
      stock: 5,
      image: ''
    });

    // Apply data validation list (dropdown menu) to the Category column on rows 2 to 500
    for (let i = 2; i <= 500; i++) {
      worksheet.getCell(`C${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"Inverters,Batteries,Coolers,Fans,Stabilizers,Smart Home Automation"']
      };
    }

    workbook.xlsx.writeBuffer().then((data) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'mohammadi_electronics_products_template.xlsx';
      anchor.click();
      window.URL.revokeObjectURL(url);
    });
  }
}

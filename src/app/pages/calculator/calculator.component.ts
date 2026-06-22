import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CalculatorAppliance {
  id: string;
  name: string;
  defaultWatts: number;
  quantity: number;
  iconSvg: string;
}

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.css'
})
export class CalculatorComponent {
  // Preset list of common appliances with clean SVG icons
  private presetAppliances: CalculatorAppliance[] = [
    {
      id: 'fan',
      name: 'Ceiling Fan',
      defaultWatts: 75,
      quantity: 3,
      iconSvg: '<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v6M12 16v6M2 12h6M16 12h6M12 12a2 2 0 100-4 2 2 0 000 4z" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    },
    {
      id: 'led-bulb',
      name: 'LED Bulb',
      defaultWatts: 9,
      quantity: 5,
      iconSvg: '<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.808 13.064a3 3 0 01-3.72-3.72 6 6 0 117.44 0a3 3 0 01-3.72 3.72z" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    },
    {
      id: 'inverter-ac',
      name: 'Inverter AC (1.5 Ton)',
      defaultWatts: 1500,
      quantity: 0,
      iconSvg: '<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7h18M3 17h18M5 12h14M8 12a1 1 0 100-2 1 1 0 000 2z" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    },
    {
      id: 'cooler',
      name: 'Desert Cooler',
      defaultWatts: 300,
      quantity: 1,
      iconSvg: '<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a9 9 0 00-9 9h18a9 9 0 00-9-9zM3 12v6a3 3 0 003 3h12a3 3 0 003-3v-6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    },
    {
      id: 'tv',
      name: 'Smart LED TV',
      defaultWatts: 100,
      quantity: 1,
      iconSvg: '<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="12" rx="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 19v2M9 21h6M7 3l5 4 5-4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    },
    {
      id: 'refrigerator',
      name: 'Double Door Fridge',
      defaultWatts: 250,
      quantity: 1,
      iconSvg: '<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M5 10h14M9 5v2M9 14v4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    }
  ];

  appliances = signal<CalculatorAppliance[]>(JSON.parse(JSON.stringify(this.presetAppliances)));
  backupHours = signal<number>(4);

  // Solar Panel Selection (Partapur local standard defaults to 150W)
  selectedPanelWatts = signal<number>(150);
  panelOptions = [150, 335, 450, 540];

  // Custom appliance state
  showCustomForm = signal(false);
  customName = signal('');
  customWatts = signal<number>(100);

  incrementQty(id: string) {
    this.appliances.update(list => list.map(app => 
      app.id === id ? { ...app, quantity: app.quantity + 1 } : app
    ));
  }

  decrementQty(id: string) {
    this.appliances.update(list => list.map(app => 
      app.id === id && app.quantity > 0 ? { ...app, quantity: app.quantity - 1 } : app
    ));
  }

  addCustomAppliance() {
    const name = this.customName().trim();
    const watts = this.customWatts();
    if (name && watts > 0) {
      const newApp: CalculatorAppliance = {
        id: 'custom-' + Date.now(),
        name: name,
        defaultWatts: watts,
        quantity: 1,
        iconSvg: '<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 10V3L4 14h7v7l9-11h-7z" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      };
      this.appliances.update(list => [...list, newApp]);
      this.customName.set('');
      this.customWatts.set(100);
      this.showCustomForm.set(false);
    }
  }

  removeAppliance(id: string) {
    this.appliances.update(list => list.filter(app => app.id !== id));
  }

  resetCalculator() {
    this.appliances.set(JSON.parse(JSON.stringify(this.presetAppliances)));
    this.backupHours.set(4);
    this.showCustomForm.set(false);
    this.customName.set('');
    this.customWatts.set(100);
  }

  // Reactive Computed properties
  totalWatts = computed(() => {
    return this.appliances().reduce((sum, app) => sum + (app.defaultWatts * app.quantity), 0);
  });

  recInverterVA = computed(() => {
    const total = this.totalWatts();
    if (total === 0) return 0;
    // VA = Watts / power_factor (0.8) * safety_margin (1.25)
    const exactVA = (total / 0.8) * 1.25;
    // Round to standard inverter capacities
    if (exactVA <= 700) return 700;
    if (exactVA <= 900) return 900;
    if (exactVA <= 1100) return 1100;
    if (exactVA <= 1500) return 1500;
    if (exactVA <= 2000) return 2000;
    if (exactVA <= 3000) return 3000;
    return Math.ceil(exactVA / 500) * 500; // Round up to nearest 500VA
  });

  recInverterModel = computed(() => {
    const va = this.recInverterVA();
    if (va === 0) return 'N/A';
    if (va <= 900) return 'Livguard 900VA / Microtek 900';
    if (va <= 1100) return 'Livguard Super 1100 / Genus 1100';
    if (va <= 1500) return 'Microtek Merlyn 1250 / Genus Carbon 1250';
    if (va <= 2000) return 'Microtek Smart Hybrid 2000 (24V)';
    return 'Genus Heavy Duty 3KVA+ System';
  });

  recBatteryWattsTotal = computed(() => {
    return this.totalWatts() * this.backupHours();
  });

  recBatteryAh = computed(() => {
    const totalWatts = this.totalWatts();
    if (totalWatts === 0) return 'N/A';
    
    // Ah = (Watts * Hours) / (Voltage * Discharge_Depth)
    // For lead acid battery standard: Voltage = 12V, Discharge Depth = 70% (0.7)
    // Formula: Total Wh / (12 * 0.7) = Wh / 8.4
    const totalWh = totalWatts * this.backupHours();
    const exactAh = totalWh / 8.4;

    if (exactAh <= 100) return '100 Ah (Single 12V Battery)';
    if (exactAh <= 150) return '150 Ah (Single 12V Battery)';
    if (exactAh <= 200) return '200 Ah (Single 12V Battery)';
    if (exactAh <= 300) return '150 Ah x 2 (24V Battery System)';
    if (exactAh <= 400) return '200 Ah x 2 (24V Battery System)';
    return '200 Ah x 4 (48V Tubular Bank)';
  });

  recBatteryDesc = computed(() => {
    const totalWatts = this.totalWatts();
    if (totalWatts === 0) return 'No load selected';
    const ahText = this.recBatteryAh();
    
    if (ahText.includes('Single')) {
      return 'Single Tall Tubular battery (e.g. Livguard IT 1560ST or Genus 150Ah) for standard domestic backups.';
    } else if (ahText.includes('x 2')) {
      return 'Double battery backup system in series (24V) to support heavy loads and high-speed discharging.';
    }
    return 'Heavy-duty tubular bank system for commercial loads or extra-long power outages.';
  });

  recOnGridSolarkW = computed(() => {
    const watts = this.totalWatts();
    if (watts === 0) return 0;
    const rawkW = (watts * 1.2) / 1000;
    if (rawkW <= 1) return 1.0;
    if (rawkW <= 2) return 2.0;
    if (rawkW <= 3) return 3.0;
    if (rawkW <= 5) return 5.0;
    if (rawkW <= 7.5) return 7.5;
    if (rawkW <= 10) return 10.0;
    return Math.ceil(rawkW);
  });

  recOffGridSolarkW = computed(() => {
    const watts = this.totalWatts();
    if (watts === 0) return 0;
    const hours = this.backupHours();
    const rawkW = (watts * hours) / 3150; // (Watts * hours) / (4.5 sun hours * 0.7 efficiency * 1000)
    if (rawkW <= 1) return 1.0;
    if (rawkW <= 2) return 2.0;
    if (rawkW <= 3) return 3.0;
    if (rawkW <= 5) return 5.0;
    if (rawkW <= 7.5) return 7.5;
    if (rawkW <= 10) return 10.0;
    return Math.ceil(rawkW);
  });

  recOnGridPanelsCount = computed(() => Math.ceil((this.recOnGridSolarkW() * 1000) / this.selectedPanelWatts()));
  recOffGridPanelsCount = computed(() => Math.ceil((this.recOffGridSolarkW() * 1000) / this.selectedPanelWatts()));
  
  // Assumes average tariff rate of ₹8 per unit and daily generation of 4 units per kW
  recOnGridMonthlySavings = computed(() => Math.round(this.recOnGridSolarkW() * 4 * 8 * 30));
  
  // Roof area requirement assumes ~85 sq. ft. per kWp
  recOnGridAreaRequired = computed(() => Math.round(this.recOnGridSolarkW() * 85));
  recOffGridAreaRequired = computed(() => Math.round(this.recOffGridSolarkW() * 85));
}

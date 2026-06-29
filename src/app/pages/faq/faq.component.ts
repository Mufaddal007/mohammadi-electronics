import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FAQItem {
  id: string;
  category: 'fitting' | 'power' | 'appliances';
  categoryLabel: string;
  question: string;
  answer: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.css'
})
export class FaqComponent {
  searchQuery = signal<string>('');
  selectedCategory = signal<'All' | 'fitting' | 'power' | 'appliances'>('All');

  faqs = signal<FAQItem[]>([
    {
      id: 'faq-1',
      category: 'fitting',
      categoryLabel: 'Home Power Fitting',
      question: 'What wire gauge size should be used for home power sockets and main lines?',
      answer: 'For heavy appliances like air conditioners, geysers, or refrigerators, a 4.0 sq mm copper wire is recommended. For standard 15A power sockets, 2.5 sq mm is preferred, while standard lighting and ceiling fan circuits can utilize 1.5 sq mm copper wiring for safety.',
      isOpen: true
    },
    {
      id: 'faq-2',
      category: 'fitting',
      categoryLabel: 'Home Power Fitting',
      question: 'Why do my ceiling lights flicker when high-power appliances turn on?',
      answer: 'Flickering lights indicate a momentary voltage drop in the sub-circuit, typically caused by starting heavy inductive loads. This happens if the wiring capacity is insufficient or if load distribution across your home lines is unbalanced. We recommend checking main distribution boards.',
      isOpen: false
    },
    {
      id: 'faq-3',
      category: 'power',
      categoryLabel: 'Inverters & Batteries',
      question: 'How do I choose the correct inverter capacity for my household load?',
      answer: 'Sum the total wattage of appliances you want to run simultaneously (e.g., 3 Fans @ 75W + 4 Lights @ 9W + 1 TV @ 100W = 361 Watts). Divide this load by the power factor (typically 0.8) to get the required VA rating (361 / 0.8 = 451 VA). A 700VA to 900VA inverter will easily support this.',
      isOpen: false
    },
    {
      id: 'faq-4',
      category: 'power',
      categoryLabel: 'Inverters & Batteries',
      question: 'How often should I top up my tubular battery with distilled water?',
      answer: 'Inverter tubular batteries should be checked every 2 to 3 months. Examine the water level indicators on top; if the float level indicator drops close to the red marking, top it up with clean distilled water. Never use tap water or mineral water as impurities can damage battery plates.',
      isOpen: false
    },
    {
      id: 'faq-5',
      category: 'appliances',
      categoryLabel: 'Household Appliances',
      question: 'Why does my mixer grinder shut off automatically during heavy grinding?',
      answer: 'Mixer grinders are equipped with an Overload Protector (OLP) thermal switch at the bottom. When overloaded or run continuously for too long, the switch trips to protect the motor from burning. To reset, let the mixer cool for 5 minutes, press the red button at the bottom of the base, and run in smaller batches.',
      isOpen: false
    },
    {
      id: 'faq-6',
      category: 'appliances',
      categoryLabel: 'Household Appliances',
      question: 'What are the main advantages of BLDC ceiling fans compared to regular fans?',
      answer: 'BLDC (Brushless DC) ceiling fans consume up to 60% less energy (typically 28W-35W compared to 75W of induction fans). They operate silently, run cool which extends motor life, function smoothly on low inverter voltages without humming, and can be easily operated using wireless remote controls.',
      isOpen: false
    }
  ]);

  toggleFaq(id: string) {
    this.faqs.update(list => 
      list.map(f => f.id === id ? { ...f, isOpen: !f.isOpen } : f)
    );
  }

  filteredFaqs = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();
    let list = this.faqs();

    if (cat !== 'All') {
      list = list.filter(f => f.category === cat);
    }

    if (query) {
      list = list.filter(f => 
        f.question.toLowerCase().includes(query) || 
        f.answer.toLowerCase().includes(query)
      );
    }

    return list;
  });
}

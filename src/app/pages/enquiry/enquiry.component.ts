import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceRequestService } from '../../services/service-request.service';

@Component({
  selector: 'app-enquiry',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './enquiry.component.html',
  styleUrl: './enquiry.component.css'
})
export class EnquiryComponent {
  private serviceRequestService = inject(ServiceRequestService);

  isSubmitted = signal(false);
  submittedName = '';
  submittedAppliance = '';
  lastGeneratedId = '';

  formData = {
    name: '',
    phone: '',
    applianceType: '',
    issueDescription: ''
  };

  onSubmit(form: any) {
    if (form.valid) {
      this.submittedName = this.formData.name.trim();
      this.submittedAppliance = this.formData.applianceType;

      this.serviceRequestService.raiseTicket({
        customer_name: this.formData.name.trim(),
        phone: this.formData.phone.trim(),
        appliance_type: this.formData.applianceType,
        issue_description: this.formData.issueDescription.trim()
      }).subscribe({
        next: (res) => {
          this.lastGeneratedId = res?.id ? String(res.id) : Date.now().toString().slice(-6);
          this.isSubmitted.set(true);
        },
        error: (err) => {
          alert('Failed to submit service request: ' + err.message);
        }
      });
    }
  }

  resetForm() {
    this.formData = {
      name: '',
      phone: '',
      applianceType: '',
      issueDescription: ''
    };
    this.isSubmitted.set(false);
  }
}

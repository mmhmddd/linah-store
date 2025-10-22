import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { OrderService, Order, OrderStatus, UpdateOrderData } from '../../core/services/order.service';
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";

@Component({
  selector: 'app-orders-control',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, DatePipe],
  templateUrl: './orders-control.component.html',
  styleUrls: ['./orders-control.component.scss']
})
export class OrdersControlComponent implements OnInit {
  // ORDERS DATA
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  totalOrders = 0;

  // FILTERS
  searchTerm = '';
  statusFilter = '';
  dateFilter = '';
  paymentFilter = '';
  governmentFilter = '';

  // EDIT MODAL
  showEditModal = false;
  editingOrder: Order | null = null;

  // CONFIRMATION MODAL
  showConfirmModal = false;
  confirmType: 'delete' | 'status' | 'success' | 'error' = 'delete';
  confirmTitle = '';
  confirmMessage = '';
  confirmOrderName = '';
  confirmButtonText = '';
  confirmOrderId = '';
  confirmNewStatus: OrderStatus = 'قيد الانتظار';

  // FILTER OPTIONS
  statusOptions = [
    { value: 'قيد الانتظار', label: 'قيد الانتظار' },
    { value: 'مسلم', label: 'مسلم' },
    { value: 'ملغي', label: 'ملغي' }
  ];

  dateOptions = [
    { value: 'today', label: 'اليوم' },
    { value: 'week', label: 'هذا الأسبوع' },
    { value: 'month', label: 'هذا الشهر' },
    { value: 'year', label: 'هذا العام' }
  ];

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    this.loadOrders();
  }

  /** LOAD ALL ORDERS */
  loadOrders() {
    this.orderService.getAllOrders().subscribe({
      next: ({ orders, count }) => {
        this.orders = orders;
        this.filteredOrders = orders;
        this.totalOrders = count;
      },
      error: (err) => {
        this.showMessage('خطأ', 'فشل في جلب الطلبات', 'error');
      }
    });
  }

  /** CLEAR FILTERS */
  clearFilters() {
    this.searchTerm = '';
    this.statusFilter = '';
    this.dateFilter = '';
    this.paymentFilter = '';
    this.governmentFilter = '';
    this.filterOrders();
  }

  /** ✅ FIXED STATUS CHANGE HANDLER */
  handleStatusChange(order: Order, event: any) {
    const newStatus = event.target.value as OrderStatus;

    // If same status or delivered, do nothing
    if (newStatus === order.status || order.status === 'مسلم') {
      event.target.value = order.status; // Reset select
      return;
    }

    // Show confirmation for cancel/delivered only
    if (newStatus === 'مسلم' || newStatus === 'ملغي') {
      this.confirmStatusChange(order._id, newStatus);
    } else {
      // Direct update for pending (no confirmation needed)
      this.updateStatus(order._id, newStatus);
    }
  }

  /** ✅ CONFIRM STATUS CHANGE */
  confirmStatusChange(orderId: string, newStatus: OrderStatus) {
    const order = this.orders.find(o => o._id === orderId);
    if (!order) return;

    this.confirmType = 'status';
    this.confirmOrderId = orderId;
    this.confirmNewStatus = newStatus;
    this.confirmOrderName = order.fullName;

    if (newStatus === 'مسلم') {
      this.confirmTitle = 'تأكيد التسليم';
      this.confirmMessage = `هل أنت متأكد من تسليم طلب ${order.fullName}؟`;
      this.confirmButtonText = 'تأكيد التسليم';
    } else if (newStatus === 'ملغي') {
      this.confirmTitle = 'إلغاء الطلب';
      this.confirmMessage = `هل أنت متأكد من إلغاء طلب ${order.fullName}؟`;
      this.confirmButtonText = 'إلغاء الطلب';
    }

    this.showConfirmModal = true;
  }

  /** CONFIRM DELETE */
  confirmDelete(orderId: string, customerName: string) {
    const order = this.orders.find(o => o._id === orderId);
    if (order?.status === 'مسلم') return;

    this.confirmType = 'delete';
    this.confirmOrderId = orderId;
    this.confirmOrderName = customerName;
    this.confirmTitle = 'حذف الطلب';
    this.confirmMessage = `هل أنت متأكد من حذف طلب ${customerName} نهائياً؟`;
    this.confirmButtonText = 'حذف نهائياً';
    this.showConfirmModal = true;
  }

  /** EXECUTE CONFIRMED ACTION */
  executeConfirmAction() {
    if (this.confirmType === 'delete') {
      this.deleteOrder(this.confirmOrderId);
    } else if (this.confirmType === 'status') {
      this.updateStatus(this.confirmOrderId, this.confirmNewStatus);
    }
    this.closeConfirmModal();
  }

  /** CLOSE CONFIRM MODAL - FIXED TO NOT CHANGE STATUS */
  closeConfirmModal() {
    this.showConfirmModal = false;
    // ✅ FIXED: Do NOT reset any status - keeps original value
  }

  /** UPDATE STATUS - FIXED */
  updateStatus(orderId: string, newStatus: OrderStatus) {
    this.orderService.updateOrderStatus(orderId, newStatus).subscribe({
      next: (updatedOrder) => {
        // Update in orders array
        const index = this.orders.findIndex(o => o._id === orderId);
        if (index !== -1) {
          this.orders[index] = updatedOrder;
        }

        // Update in filteredOrders
        const filteredIndex = this.filteredOrders.findIndex(o => o._id === orderId);
        if (filteredIndex !== -1) {
          this.filteredOrders[filteredIndex] = updatedOrder;
        }

        this.filterOrders();
        this.showMessage('نجح', `تم تحديث حالة الطلب إلى ${newStatus}`, 'success');
      },
      error: (err) => {
        console.error('Status update failed:', err);
        this.showMessage('خطأ', 'فشل في تحديث حالة الطلب', 'error');
        // Reload to restore original data
        this.loadOrders();
      }
    });
  }

  /** DELETE ORDER */
  deleteOrder(orderId: string) {
    this.orderService.deleteOrder(orderId).subscribe({
      next: () => {
        this.orders = this.orders.filter(o => o._id !== orderId);
        this.totalOrders--;
        this.filterOrders();
        this.showMessage('نجح', 'تم حذف الطلب بنجاح', 'success');
      },
      error: (err) => {
        console.error('Delete failed:', err);
        this.showMessage('خطأ', 'فشل في حذف الطلب', 'error');
      }
    });
  }

  /** SHOW MESSAGE */
  showMessage(title: string, message: string, type: 'success' | 'error') {
    this.confirmType = type;
    this.confirmTitle = title;
    this.confirmMessage = message;
    this.confirmOrderName = '';
    this.confirmButtonText = 'تم';
    this.showConfirmModal = true;

    setTimeout(() => {
      this.closeConfirmModal();
    }, 2000);
  }

  /** OPEN EDIT MODAL */
  openEditModal(order: Order) {
    this.editingOrder = { ...order };
    this.showEditModal = true;
  }

  /** CLOSE EDIT MODAL */
  closeEditModal() {
    this.showEditModal = false;
    this.editingOrder = null;
  }

  /** SAVE ORDER */
  saveOrder() {
    if (!this.editingOrder) return;

    const updateData: UpdateOrderData = {
      fullName: this.editingOrder.fullName,
      government: this.editingOrder.government,
      address: this.editingOrder.address,
      paymentMethod: this.editingOrder.paymentMethod,
      saleCode: this.editingOrder.saleCode || undefined,
      notes: this.editingOrder.notes || undefined
    };

    this.orderService.updateOrder(this.editingOrder._id, updateData).subscribe({
      next: (updatedOrder) => {
        const index = this.orders.findIndex(o => o._id === updatedOrder._id);
        if (index !== -1) {
          this.orders[index] = updatedOrder;
        }
        this.filterOrders();
        this.closeEditModal();
        this.showMessage('نجح', 'تم حفظ التغييرات بنجاح', 'success');
      },
      error: (err) => {
        console.error('Order update failed:', err);
        this.showMessage('خطأ', 'فشل في حفظ التغييرات', 'error');
      }
    });
  }

  /** SAFE ORDER ID */
  getOrderId(): string {
    return this.editingOrder?._id?.substring(this.editingOrder._id.length - 6) || '...';
  }

  /** AVAILABLE STATUSES */
  getAvailableStatuses(currentStatus: OrderStatus): OrderStatus[] {
    const allStatuses: OrderStatus[] = ['قيد الانتظار', 'مسلم', 'ملغي'];
    return currentStatus === 'مسلم' ? ['مسلم'] : allStatuses;
  }

  /** EXPORT */
  exportOrders() {
    console.log('Exporting orders...');
  }

  /** FILTER ORDERS */
  filterOrders() {
    let filtered = [...this.orders];

    // Search
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.fullName.toLowerCase().includes(term) ||
        order._id.toLowerCase().includes(term) ||
        order.government.toLowerCase().includes(term)
      );
    }

    // Status
    if (this.statusFilter) {
      filtered = filtered.filter(order => order.status === this.statusFilter);
    }

    // Payment
    if (this.paymentFilter) {
      filtered = filtered.filter(order => order.paymentMethod === this.paymentFilter);
    }

    // Government
    if (this.governmentFilter) {
      filtered = filtered.filter(order => order.government === this.governmentFilter);
    }

    // Date
    if (this.dateFilter) {
      const now = new Date();
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        switch (this.dateFilter) {
          case 'today': return orderDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return orderDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return orderDate >= monthAgo;
          case 'year':
            const yearAgo = new Date(now.getFullYear(), 0, 1);
            return orderDate >= yearAgo;
          default: return true;
        }
      });
    }

    this.filteredOrders = filtered;
  }

  /** STATUS STATS */
  getStatusStats() {
    const stats: Record<OrderStatus, number> = {
      'قيد الانتظار': 0, 'مسلم': 0, 'ملغي': 0
    };
    this.orders.forEach(order => stats[order.status]++);
    return Object.entries(stats)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({ status: status as OrderStatus, count }));
  }

  /** UTILS */
  getStatusIcon(status: OrderStatus): string {
    const icons: { [key in OrderStatus]: string } = {
      'قيد الانتظار': '⏳', 'مسلم': '✅', 'ملغي': '❌'
    };
    return icons[status];
  }

  getStatusLabel(status: OrderStatus): string {
    return status;
  }

  getStatusColor(status: OrderStatus): string {
    const colors: { [key in OrderStatus]: string } = {
      'قيد الانتظار': '#F59E0B', 'مسلم': '#10B981', 'ملغي': '#EF4444'
    };
    return colors[status];
  }
}

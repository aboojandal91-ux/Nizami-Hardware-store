import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { Product, Customer, Supplier, PurchaseOrder, SaleRecord, Expense, AuditLog } from './types';

export const migrateLocalToFirebase = async () => {
    const products: Product[] = JSON.parse(localStorage.getItem('hw_products') || '[]');
    const customers: Customer[] = JSON.parse(localStorage.getItem('hw_customers') || '[]');
    const suppliers: Supplier[] = JSON.parse(localStorage.getItem('hw_suppliers') || '[]');
    const purchaseOrders: PurchaseOrder[] = JSON.parse(localStorage.getItem('hw_purchase_orders') || '[]');
    const sales: SaleRecord[] = JSON.parse(localStorage.getItem('hw_sales') || '[]');
    const expenses: Expense[] = JSON.parse(localStorage.getItem('hw_expenses') || '[]');
    const auditLogs: AuditLog[] = JSON.parse(localStorage.getItem('hw_audit_logs') || '[]');

    const batch = writeBatch(db);

    products.forEach(p => batch.set(doc(collection(db, 'products'), p.id), p));
    
    customers.forEach(c => {
        const { ledger, paymentSchedule, ...rest } = c as any;
        batch.set(doc(collection(db, 'customers'), rest.id), rest);
        
        if (ledger) {
            ledger.forEach((l: any) => batch.set(doc(collection(db, `customers/${rest.id}/ledger`), l.id), l));
        }
        if (paymentSchedule) {
            paymentSchedule.forEach((s: any) => batch.set(doc(collection(db, `customers/${rest.id}/paymentSchedule`), s.id), s));
        }
    });

    suppliers.forEach(s => {
        const { ledger, ...rest } = s as any;
        batch.set(doc(collection(db, 'suppliers'), rest.id), rest);
        
        if (ledger) {
            ledger.forEach((l: any) => batch.set(doc(collection(db, `suppliers/${rest.id}/ledger`), l.id), l));
        }
    });

    purchaseOrders.forEach(po => {
        const { paymentSchedule, ...rest } = po as any;
        batch.set(doc(collection(db, 'purchaseOrders'), rest.id), rest);
        
        if (paymentSchedule) {
            paymentSchedule.forEach((s: any) => batch.set(doc(collection(db, `purchaseOrders/${rest.id}/paymentSchedule`), s.id), s));
        }
    });

    sales.forEach(s => batch.set(doc(collection(db, 'sales'), s.id), s));
    expenses.forEach(e => batch.set(doc(collection(db, 'expenses'), e.id), e));

    // Audit logs require 'uid' field according to rules
    // So we'll skip auditLogs as they need the auth.uid

    await batch.commit();
    return true;
};

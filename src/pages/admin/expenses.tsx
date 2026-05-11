import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useListExpenses, useCreateExpense, useDeleteExpense, getListExpensesQueryKey } from "@/api";

const CATEGORIES = ["ingredients", "equipment", "utilities", "salaries", "marketing", "packaging", "other"];

const EMPTY_FORM = { category: "ingredients", description: "", amount: "", date: new Date().toISOString().slice(0, 10) };

export default function AdminExpensesPage() {
  const { data: expenses, isLoading } = useListExpenses();
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const total = expenses?.reduce((s, e) => s + e.amount, 0) ?? 0;
  const monthTotal = expenses
    ?.filter((e) => e.date.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((s, e) => s + e.amount, 0) ?? 0;

  const handleAdd = () => {
    createExpense.mutate(
      { data: { category: form.category, description: form.description, amount: Number(form.amount), date: form.date } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey() });
          setForm({ ...EMPTY_FORM });
          setShowForm(false);
          toast({ title: "Expense recorded" });
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this expense?")) return;
    deleteExpense.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey() });
        toast({ title: "Expense deleted" });
      },
    });
  };

  const CATEGORY_COLORS: Record<string, string> = {
    ingredients: "bg-primary/20 text-primary",
    equipment: "bg-blue-500/20 text-blue-400",
    utilities: "bg-yellow-500/20 text-yellow-400",
    salaries: "bg-purple-500/20 text-purple-400",
    marketing: "bg-pink-500/20 text-pink-400",
    packaging: "bg-orange-500/20 text-orange-400",
    other: "bg-muted text-muted-foreground",
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">Expenses</h1>
            <p className="text-muted-foreground text-sm mt-1">{expenses?.length ?? 0} expense records</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-primary text-primary-foreground" data-testid="button-add-expense">
            <Plus className="w-4 h-4 mr-1" /> Add Expense
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">This Month</p>
            <p className="text-2xl font-bold text-foreground mt-1" data-testid="text-month-total">Rs {Math.round(monthTotal)}</p>
          </div>
          <div className="glass-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">All Time</p>
            <p className="text-2xl font-bold text-foreground mt-1" data-testid="text-total-expenses">Rs {Math.round(total)}</p>
          </div>
        </div>

        {/* Add Form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass-card border border-primary/20 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" /> New Expense</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Category</Label>
                <select value={form.category} onChange={handleChange("category")} className="w-full mt-1 h-9 rounded-lg bg-muted border border-border text-foreground text-sm px-3 capitalize" data-testid="select-expense-category">
                  {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Date</Label>
                <Input type="date" value={form.date} onChange={handleChange("date")} className="mt-1 bg-muted border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Input value={form.description} onChange={handleChange("description")} placeholder="What was this for?" className="mt-1 bg-muted border-border" data-testid="input-expense-description" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Amount (Rs)</Label>
                <Input type="number" value={form.amount} onChange={handleChange("amount")} className="mt-1 bg-muted border-border" data-testid="input-expense-amount" />
              </div>
            </div>
            <Button onClick={handleAdd} disabled={createExpense.isPending} className="bg-primary text-primary-foreground" data-testid="button-save-expense">
              {createExpense.isPending ? "Saving..." : "Add Expense"}
            </Button>
          </motion.div>
        )}

        {/* Expenses Table */}
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
        ) : expenses?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No expenses recorded yet</p>
          </div>
        ) : (
          <div className="glass-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {expenses?.slice().reverse().map((expense) => (
                    <tr key={expense.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-expense-${expense.id}`}>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${CATEGORY_COLORS[expense.category] ?? CATEGORY_COLORS.other}`}>
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground">{expense.description}</td>
                      <td className="px-4 py-3 text-muted-foreground">{expense.date}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">Rs {Math.round(expense.amount)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDelete(expense.id)} className="text-destructive hover:text-destructive/80 transition-colors" data-testid={`button-delete-expense-${expense.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

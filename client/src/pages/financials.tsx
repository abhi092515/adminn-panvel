import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Plus,
  CreditCard,
  DollarSign,
  FileText,
  Download,
  CheckCircle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import type { Transaction, Settlement, Expense, SettlementSummary } from "@shared/schema";
import { insertExpenseSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EXPENSE_CATEGORIES } from "@/lib/constants";

const expenseFormSchema = insertExpenseSchema.extend({
  amount: z.coerce.number().positive("Amount must be positive"),
  category: z.string().min(1, "Please select a category"),
  date: z.string().min(1, "Please select a date"),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down";
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const variantClasses = {
    default: "",
    success: "border-green-500/30",
    warning: "border-orange-500/30",
    danger: "border-red-500/30",
  };

  return (
    <Card className={variantClasses[variant]}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`stat-${title.toLowerCase().replace(/\s/g, '-')}`}>{value}</div>
        {(subtitle || trend) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            {trend && (
              trend === "up" ? (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )
            )}
            {subtitle}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AddExpenseDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      category: "",
      amount: 0,
      description: "",
      date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const createExpense = useMutation({
    mutationFn: async (data: ExpenseFormValues) => {
      const response = await apiRequest("POST", "/api/expenses", {
        ...data,
        amount: data.amount.toString(),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Expense added successfully" });
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add expense",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ExpenseFormValues) => {
    createExpense.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>Track your venue operating costs</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-expense-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} data-testid="input-expense-amount" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} data-testid="input-expense-date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Monthly electricity bill"
                      {...field}
                      value={field.value || ""}
                      data-testid="input-expense-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createExpense.isPending} data-testid="button-save-expense">
                {createExpense.isPending ? "Saving..." : "Add Expense"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function SettlementCard({ settlement }: { settlement: SettlementSummary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Platform Settlement
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted rounded-md">
              <div className="text-xs text-muted-foreground">Total Earnings</div>
              <div className="text-lg font-bold text-green-500">
                ₹{settlement.totalEarnings.toLocaleString()}
              </div>
            </div>
            <div className="text-center p-3 bg-muted rounded-md">
              <div className="text-xs text-muted-foreground">Settled</div>
              <div className="text-lg font-bold">
                ₹{settlement.totalSettled.toLocaleString()}
              </div>
            </div>
            <div className="text-center p-3 bg-muted rounded-md">
              <div className="text-xs text-muted-foreground">Amount Due</div>
              <div className="text-lg font-bold text-orange-500">
                ₹{settlement.amountDue.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Commission Rate</div>
                <div className="text-xs text-muted-foreground">
                  On cash payments received
                </div>
              </div>
              <Badge variant="secondary">{settlement.commissionRate}%</Badge>
            </div>
          </div>

          {settlement.amountDue > 0 && (
            <Button className="w-full" data-testid="button-pay-now">
              <CreditCard className="h-4 w-4 mr-2" />
              Pay ₹{settlement.amountDue.toLocaleString()} Now
            </Button>
          )}

          <div className="space-y-2">
            <div className="text-sm font-medium">Pending Settlements</div>
            {settlement.pendingSettlements.length > 0 ? (
              settlement.pendingSettlements.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2 bg-muted rounded-md text-sm"
                >
                  <div>
                    <span className="font-medium">
                      {s.periodStart} - {s.periodEnd}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      ({s.totalBookings} bookings)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">₹{s.amount}</span>
                    <Badge
                      variant={s.status === "paid" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {s.status === "paid" ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <Clock className="h-3 w-3 mr-1" />
                      )}
                      {s.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No pending settlements
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Financials() {
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);

  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: expenses, isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: settlement, isLoading: settlementLoading } = useQuery<SettlementSummary>({
    queryKey: ["/api/settlements/summary"],
  });

  const totalRevenue = transactions?.reduce(
    (sum, t) => (t.type === "booking_payment" ? sum + Number(t.amount) : sum),
    0
  ) || 0;

  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Financials</h1>
          <p className="text-muted-foreground text-sm">
            Track revenue, expenses, and platform settlements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setExpenseDialogOpen(true)}
            data-testid="button-add-expense"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
          <Button variant="outline" data-testid="button-download-report">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
          icon={TrendingUp}
          trend="up"
          subtitle="+15% this month"
          variant="success"
        />
        <StatCard
          title="Total Expenses"
          value={`₹${totalExpenses.toLocaleString()}`}
          icon={ArrowDownRight}
          subtitle="Operating costs"
        />
        <StatCard
          title="Net Profit"
          value={`₹${netProfit.toLocaleString()}`}
          icon={DollarSign}
          trend={netProfit > 0 ? "up" : "down"}
          variant={netProfit > 0 ? "success" : "danger"}
        />
        <StatCard
          title="Platform Due"
          value={`₹${(settlement?.amountDue || 0).toLocaleString()}`}
          icon={Wallet}
          subtitle="Commission pending"
          variant={settlement?.amountDue && settlement.amountDue > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-lg">Financial Records</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="transactions">
                <TabsList className="mb-4">
                  <TabsTrigger value="transactions" data-testid="tab-transactions">
                    Transactions
                  </TabsTrigger>
                  <TabsTrigger value="expenses" data-testid="tab-expenses">
                    Expenses
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="transactions">
                  {transactionsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions?.slice(0, 10).map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell className="text-sm">
                                {format(new Date(transaction.createdAt), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {transaction.type.replace("_", " ")}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm capitalize">
                                {transaction.paymentMethod}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                <span
                                  className={
                                    transaction.type === "refund"
                                      ? "text-red-500"
                                      : "text-green-500"
                                  }
                                >
                                  {transaction.type === "refund" ? "-" : "+"}₹
                                  {Number(transaction.amount).toLocaleString()}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    transaction.status === "completed"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {transaction.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {(!transactions || transactions.length === 0) && (
                        <div className="text-center py-12 text-muted-foreground">
                          <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No transactions yet</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="expenses">
                  {expensesLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {expenses?.map((expense) => (
                            <TableRow key={expense.id}>
                              <TableCell className="text-sm">
                                {expense.date}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {expense.category}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {expense.description || "-"}
                              </TableCell>
                              <TableCell className="text-right font-medium text-red-500">
                                -₹{Number(expense.amount).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {(!expenses || expenses.length === 0) && (
                        <div className="text-center py-12 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No expenses recorded</p>
                          <Button
                            variant="link"
                            className="mt-2"
                            onClick={() => setExpenseDialogOpen(true)}
                            data-testid="link-add-first-expense"
                          >
                            Add your first expense
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div>
          {settlementLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <SettlementCard
              settlement={
                settlement || {
                  totalEarnings: 0,
                  totalSettled: 0,
                  amountDue: 0,
                  commissionRate: 5,
                  pendingSettlements: [],
                }
              }
            />
          )}
        </div>
      </div>

      <AddExpenseDialog
        open={expenseDialogOpen}
        onClose={() => setExpenseDialogOpen(false)}
      />
    </div>
  );
}

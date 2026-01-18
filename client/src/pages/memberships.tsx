import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, Crown, Gift, CreditCard, Calendar, Users, 
  Loader2, Star, Percent, Clock, TrendingUp,
  Award, Coins, Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { MembershipPlan, Customer, MembershipWithPlan } from "@shared/schema";

export default function Memberships() {
  const { toast } = useToast();
  const isOwner = true;
  const [activeTab, setActiveTab] = useState("memberships");
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
  const [isAddMembershipOpen, setIsAddMembershipOpen] = useState(false);

  const { data: plans = [], isLoading: plansLoading } = useQuery<MembershipPlan[]>({
    queryKey: ["/api/membership-plans"],
  });

  const { data: memberships = [], isLoading: membershipsLoading } = useQuery<MembershipWithPlan[]>({
    queryKey: ["/api/memberships"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const createPlanMutation = useMutation({
    mutationFn: async (plan: Partial<MembershipPlan>) => {
      return apiRequest("POST", "/api/membership-plans", plan);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/membership-plans"] });
      setIsAddPlanOpen(false);
      toast({ title: "Success", description: "Membership plan created." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create plan.", variant: "destructive" });
    },
  });

  const createMembershipMutation = useMutation({
    mutationFn: async (membership: any) => {
      return apiRequest("POST", "/api/memberships", membership);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memberships"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsAddMembershipOpen(false);
      toast({ title: "Success", description: "Membership activated for customer." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create membership.", variant: "destructive" });
    },
  });

  const activeMemberships = memberships.filter(m => m.status === "active");
  const expiredMemberships = memberships.filter(m => m.status === "expired" || m.status === "cancelled");

  const totalRevenue = memberships.reduce((sum, m) => sum + Number(m.paidAmount), 0);

  if (plansLoading || membershipsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            Memberships & Loyalty
          </h1>
          <p className="text-muted-foreground">Manage membership plans and customer loyalty points</p>
        </div>
        <div className="flex gap-2">
          {isOwner && (
            <Dialog open={isAddPlanOpen} onOpenChange={setIsAddPlanOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-add-plan">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Plan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <AddPlanForm 
                  onSubmit={(plan) => createPlanMutation.mutate(plan)} 
                  isLoading={createPlanMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          )}
          <Dialog open={isAddMembershipOpen} onOpenChange={setIsAddMembershipOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-membership">
                <Plus className="w-4 h-4 mr-2" />
                Assign Membership
              </Button>
            </DialogTrigger>
            <DialogContent>
              <AssignMembershipForm 
                plans={plans}
                customers={customers}
                onSubmit={(m) => createMembershipMutation.mutate(m)}
                isLoading={createMembershipMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <Crown className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-active-count">{activeMemberships.length}</p>
                <p className="text-sm text-muted-foreground">Active Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-revenue">
                  Rs. {totalRevenue.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Gift className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-plans-count">{plans.length}</p>
                <p className="text-sm text-muted-foreground">Available Plans</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-retention">
                  {activeMemberships.length > 0 
                    ? Math.round((activeMemberships.length / memberships.length) * 100)
                    : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Retention Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="memberships" data-testid="tab-memberships">
            <Users className="w-4 h-4 mr-2" />
            Memberships
          </TabsTrigger>
          <TabsTrigger value="plans" data-testid="tab-plans">
            <Crown className="w-4 h-4 mr-2" />
            Plans
          </TabsTrigger>
          <TabsTrigger value="loyalty" data-testid="tab-loyalty">
            <Coins className="w-4 h-4 mr-2" />
            Loyalty Program
          </TabsTrigger>
        </TabsList>

        <TabsContent value="memberships" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Memberships</CardTitle>
              <CardDescription>Current members with active subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              {activeMemberships.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Crown className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No active memberships yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Free Hours</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeMemberships.map((m) => {
                      const customer = customers.find(c => c.id === m.customerId);
                      return (
                        <TableRow key={m.id} data-testid={`row-membership-${m.id}`}>
                          <TableCell className="font-medium">{customer?.name || "Unknown"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{m.plan?.name}</Badge>
                          </TableCell>
                          <TableCell>{m.startDate}</TableCell>
                          <TableCell>{m.endDate}</TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-green-500">Active</Badge>
                          </TableCell>
                          <TableCell>
                            {m.usedFreeHours || 0} / {m.plan?.freeHours || 0} hrs
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          {plans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Gift className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No membership plans created yet</p>
                {isOwner && (
                  <Button className="mt-4" onClick={() => setIsAddPlanOpen(true)}>
                    Create First Plan
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="loyalty" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Loyalty Program
              </CardTitle>
              <CardDescription>
                Customers earn points for every booking and can redeem them for discounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800">
                  <CardContent className="pt-6">
                    <Award className="w-10 h-10 text-yellow-500 mb-4" />
                    <h3 className="font-semibold text-lg">Earn Points</h3>
                    <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        10 points per Rs. 100 spent on bookings
                      </li>
                      <li className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        10 points per Rs. 100 on membership purchase
                      </li>
                      <li className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        Bonus points on tournament participation
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                  <CardContent className="pt-6">
                    <Gift className="w-10 h-10 text-green-500 mb-4" />
                    <h3 className="font-semibold text-lg">Redeem Rewards</h3>
                    <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-green-500" />
                        100 points = Rs. 50 discount
                      </li>
                      <li className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-green-500" />
                        500 points = 1 free hour
                      </li>
                      <li className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-green-500" />
                        1000 points = Free session
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  View customer loyalty points from the Customer details page. 
                  Points are automatically earned on completed bookings and can be redeemed at checkout.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PlanCard({ plan }: { plan: MembershipPlan }) {
  return (
    <Card className="relative overflow-visible" data-testid={`card-plan-${plan.id}`}>
      {plan.priority && (
        <div className="absolute -top-2 -right-2">
          <Badge className="bg-yellow-500">Popular</Badge>
        </div>
      )}
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-500" />
          {plan.name}
        </CardTitle>
        <CardDescription>{plan.description || "Membership plan"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-3xl font-bold">
          Rs. {Number(plan.price).toLocaleString()}
          <span className="text-sm font-normal text-muted-foreground">
            /{plan.durationDays} days
          </span>
        </div>
        
        <div className="space-y-2">
          {plan.discountPercent > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Percent className="w-4 h-4 text-green-500" />
              <span>{plan.discountPercent}% discount on bookings</span>
            </div>
          )}
          {plan.freeHours > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>{plan.freeHours} free hours/month</span>
            </div>
          )}
          {plan.priority && (
            <div className="flex items-center gap-2 text-sm">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>Priority booking access</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>{plan.durationDays} days validity</span>
          </div>
        </div>

        <Badge variant={plan.isActive ? "default" : "secondary"}>
          {plan.isActive ? "Active" : "Inactive"}
        </Badge>
      </CardContent>
    </Card>
  );
}

function AddPlanForm({ 
  onSubmit, 
  isLoading 
}: { 
  onSubmit: (plan: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    durationDays: 30,
    price: "",
    discountPercent: 0,
    freeHours: 0,
    priority: false,
    isActive: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Create Membership Plan</DialogTitle>
        <DialogDescription>Define a new membership tier for your customers</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Plan Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Silver, Gold, Platinum"
            required
            data-testid="input-plan-name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of benefits"
            data-testid="input-plan-description"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price (Rs.)</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="1000"
              required
              data-testid="input-plan-price"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (days)</Label>
            <Select
              value={String(formData.durationDays)}
              onValueChange={(v) => setFormData({ ...formData, durationDays: Number(v) })}
            >
              <SelectTrigger data-testid="select-plan-duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 days (1 month)</SelectItem>
                <SelectItem value="90">90 days (3 months)</SelectItem>
                <SelectItem value="180">180 days (6 months)</SelectItem>
                <SelectItem value="365">365 days (1 year)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="discount">Discount %</Label>
            <Input
              id="discount"
              type="number"
              value={formData.discountPercent}
              onChange={(e) => setFormData({ ...formData, discountPercent: Number(e.target.value) })}
              placeholder="10"
              min={0}
              max={100}
              data-testid="input-plan-discount"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="freeHours">Free Hours/Month</Label>
            <Input
              id="freeHours"
              type="number"
              value={formData.freeHours}
              onChange={(e) => setFormData({ ...formData, freeHours: Number(e.target.value) })}
              placeholder="2"
              min={0}
              data-testid="input-plan-free-hours"
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="priority">Priority Booking Access</Label>
          <Switch
            id="priority"
            checked={formData.priority}
            onCheckedChange={(checked) => setFormData({ ...formData, priority: checked })}
            data-testid="switch-plan-priority"
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isLoading} data-testid="button-submit-plan">
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Create Plan
        </Button>
      </DialogFooter>
    </form>
  );
}

function AssignMembershipForm({
  plans,
  customers,
  onSubmit,
  isLoading,
}: {
  plans: MembershipPlan[];
  customers: Customer[];
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    customerId: "",
    planId: "",
    paidAmount: "",
    paymentMethod: "cash",
  });

  const selectedPlan = plans.find(p => p.id === formData.planId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + (selectedPlan?.durationDays || 30));
    
    onSubmit({
      ...formData,
      startDate: today.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      status: "active",
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Assign Membership</DialogTitle>
        <DialogDescription>Activate a membership for a customer</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="customer">Customer</Label>
          <Select
            value={formData.customerId}
            onValueChange={(v) => setFormData({ ...formData, customerId: v })}
          >
            <SelectTrigger data-testid="select-customer">
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} - {c.phone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="plan">Membership Plan</Label>
          <Select
            value={formData.planId}
            onValueChange={(v) => {
              const plan = plans.find(p => p.id === v);
              setFormData({ 
                ...formData, 
                planId: v,
                paidAmount: plan ? String(plan.price) : "",
              });
            }}
          >
            <SelectTrigger data-testid="select-plan">
              <SelectValue placeholder="Select plan" />
            </SelectTrigger>
            <SelectContent>
              {plans.filter(p => p.isActive).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} - Rs. {Number(p.price).toLocaleString()} ({p.durationDays} days)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount Paid (Rs.)</Label>
            <Input
              id="amount"
              type="number"
              value={formData.paidAmount}
              onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
              required
              data-testid="input-paid-amount"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="method">Payment Method</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}
            >
              <SelectTrigger data-testid="select-payment-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {selectedPlan && (
          <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
            <p className="font-medium">{selectedPlan.name} Benefits:</p>
            {selectedPlan.discountPercent > 0 && (
              <p>{selectedPlan.discountPercent}% booking discount</p>
            )}
            {selectedPlan.freeHours > 0 && (
              <p>{selectedPlan.freeHours} free hours/month</p>
            )}
            {selectedPlan.priority && (
              <p>Priority booking access</p>
            )}
          </div>
        )}
      </div>
      <DialogFooter>
        <Button 
          type="submit" 
          disabled={isLoading || !formData.customerId || !formData.planId}
          data-testid="button-submit-membership"
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Activate Membership
        </Button>
      </DialogFooter>
    </form>
  );
}

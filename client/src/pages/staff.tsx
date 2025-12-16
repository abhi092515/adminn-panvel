import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Shield, UserCog, Users, Loader2, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import type { User } from "@shared/schema";
import { rolePermissions } from "@shared/models/auth";

export default function StaffManagement() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect non-owners to dashboard
  useEffect(() => {
    if (!authLoading && currentUser && currentUser.role !== "owner") {
      toast({
        title: "Access Denied",
        description: "Only owners can access staff management.",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [authLoading, currentUser, setLocation, toast]);

  const { data: staffList, isLoading, error } = useQuery<User[]>({
    queryKey: ["/api/staff"],
    enabled: currentUser?.role === "owner",
  });

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show access denied if not owner
  if (currentUser?.role !== "owner") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <ShieldAlert className="w-12 h-12 text-destructive" />
        <h2 className="text-lg font-semibold">Access Denied</h2>
        <p className="text-muted-foreground">Only owners can manage staff.</p>
      </div>
    );
  }

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return apiRequest("PATCH", `/api/staff/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({ title: "Role updated", description: "Staff role has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update role.", variant: "destructive" });
    },
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner":
        return "default";
      case "manager":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Shield className="w-3 h-3" />;
      case "manager":
        return <UserCog className="w-3 h-3" />;
      default:
        return <Users className="w-3 h-3" />;
    }
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            Staff Management
          </h1>
          <p className="text-muted-foreground">
            Manage staff accounts and permissions
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-staff">
              <Plus className="w-4 h-4 mr-2" />
              Invite Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Staff Member</DialogTitle>
              <DialogDescription>
                Staff members can sign up using their email. Once they log in, you can assign them a role.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Share the venue login link with your staff. Once they sign in, their account will appear here and you can assign their role.
              </p>
              <div className="p-4 bg-muted rounded-md">
                <code className="text-sm break-all">{window.location.origin}/api/login</code>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-staff">
              {staffList?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Owners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-owners-count">
              {staffList?.filter((s) => s.role === "owner").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Receptionists</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-receptionists-count">
              {staffList?.filter((s) => s.role === "receptionist").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
          <CardDescription>
            View and manage staff accounts and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : !staffList?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No staff members yet</p>
              <p className="text-sm">Staff will appear here after they sign in</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffList.map((staff) => (
                  <TableRow key={staff.id} data-testid={`row-staff-${staff.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={staff.profileImageUrl || undefined} />
                          <AvatarFallback>
                            {getInitials(staff.firstName, staff.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {staff.firstName} {staff.lastName}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{staff.email || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(staff.role || "receptionist")}>
                        <span className="flex items-center gap-1">
                          {getRoleIcon(staff.role || "receptionist")}
                          {staff.role || "receptionist"}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {staff.createdAt
                        ? new Date(staff.createdAt).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Select
                        defaultValue={staff.role || "receptionist"}
                        onValueChange={(value) =>
                          updateRoleMutation.mutate({ userId: staff.id, role: value })
                        }
                      >
                        <SelectTrigger
                          className="w-32"
                          data-testid={`select-role-${staff.id}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="receptionist">Receptionist</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>
            Overview of what each role can do
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(rolePermissions).map(([role, permissions]) => (
              <div key={role} className="space-y-2">
                <div className="flex items-center gap-2">
                  {getRoleIcon(role)}
                  <h3 className="font-medium capitalize">{role}</h3>
                </div>
                <ul className="space-y-1">
                  {permissions.map((permission) => (
                    <li
                      key={permission}
                      className="text-sm text-muted-foreground flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {permission.replace(/_/g, " ")}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequestJson, queryClient } from "@/lib/queryClient";
import type { MainCategory, Category } from "@shared/schema";
import { Loader2, Plus, Edit3, Trash2 } from "lucide-react";

const baseSchema = {
  title: z.string().min(1, "Required"),
  image: z.string().url().optional().or(z.literal("")),
  priority: z.coerce.number().int().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
};

const mainCategorySchema = z.object(baseSchema);
const categorySchema = z.object({ ...baseSchema, mainCategoryId: z.string().optional().or(z.literal("")) });

type MainCategoryForm = z.infer<typeof mainCategorySchema>;
type CategoryForm = z.infer<typeof categorySchema>;

export default function CategoriesPage() {
  const { toast } = useToast();
  const [openMain, setOpenMain] = useState(false);
  const [openCat, setOpenCat] = useState(false);
  const [editingMain, setEditingMain] = useState<MainCategory | null>(null);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const { data: mains, isLoading: mainsLoading } = useQuery<MainCategory[]>({
    queryKey: ["/api/main-categories"],
  });
  const { data: cats, isLoading: catsLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const mainForm = useForm<MainCategoryForm>({ resolver: zodResolver(mainCategorySchema) });
  const catForm = useForm<CategoryForm>({ resolver: zodResolver(categorySchema) });

  const resetMain = () => { mainForm.reset(); setEditingMain(null); setOpenMain(false); };
  const resetCat = () => { catForm.reset(); setEditingCat(null); setOpenCat(false); };

  const createMain = useMutation({
    mutationFn: (values: MainCategoryForm) => apiRequestJson("POST", "/api/main-categories", normalize(values)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/main-categories"] }); toast({ title: "Main category created" }); resetMain(); },
    onError: (e: any) => toast({ title: "Failed", description: e?.message, variant: "destructive" }),
  });
  const updateMain = useMutation({
    mutationFn: ({ id, values }: { id: string; values: MainCategoryForm }) => apiRequestJson("PATCH", `/api/main-categories/${id}`, normalize(values)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/main-categories"] }); toast({ title: "Main category updated" }); resetMain(); },
    onError: (e: any) => toast({ title: "Failed", description: e?.message, variant: "destructive" }),
  });
  const deleteMain = useMutation({
    mutationFn: (id: string) => apiRequestJson("DELETE", `/api/main-categories/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/main-categories"] }); toast({ title: "Main category deleted" }); },
    onError: (e: any) => toast({ title: "Failed", description: e?.message, variant: "destructive" }),
  });

  const createCat = useMutation({
    mutationFn: (values: CategoryForm) => apiRequestJson("POST", "/api/categories", normalize(values)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/categories"] }); toast({ title: "Category created" }); resetCat(); },
    onError: (e: any) => toast({ title: "Failed", description: e?.message, variant: "destructive" }),
  });
  const updateCat = useMutation({
    mutationFn: ({ id, values }: { id: string; values: CategoryForm }) => apiRequestJson("PATCH", `/api/categories/${id}`, normalize(values)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/categories"] }); toast({ title: "Category updated" }); resetCat(); },
    onError: (e: any) => toast({ title: "Failed", description: e?.message, variant: "destructive" }),
  });
  const deleteCat = useMutation({
    mutationFn: (id: string) => apiRequestJson("DELETE", `/api/categories/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/categories"] }); toast({ title: "Category deleted" }); },
    onError: (e: any) => toast({ title: "Failed", description: e?.message, variant: "destructive" }),
  });

  const normalize = <T extends { [k: string]: any }>(values: T) => {
    const copy = { ...values } as any;
    copy.image = copy.image || undefined;
    copy.description = copy.description || undefined;
    copy.status = copy.status || undefined;
    copy.priority = copy.priority ?? undefined;
    if (copy.mainCategoryId === "") copy.mainCategoryId = undefined;
    return copy;
  };

  const handleMainSubmit = (values: MainCategoryForm) => {
    editingMain ? updateMain.mutate({ id: editingMain.id, values }) : createMain.mutate(values);
  };
  const handleCatSubmit = (values: CategoryForm) => {
    editingCat ? updateCat.mutate({ id: editingCat.id, values }) : createCat.mutate(values);
  };

  const loadingMain = mainsLoading || createMain.isPending || updateMain.isPending;
  const loadingCat = catsLoading || createCat.isPending || updateCat.isPending;

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Categories</h1>
          <p className="text-muted-foreground">Manage main categories and nested categories.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setOpenMain(true)} data-testid="btn-add-main-cat"><Plus className="h-4 w-4 mr-2" />Main Category</Button>
          <Button variant="outline" onClick={() => setOpenCat(true)} data-testid="btn-add-cat"><Plus className="h-4 w-4 mr-2" />Category</Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Main Categories</CardTitle>
          <CardDescription>Top-level grouping for venues.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingMain ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
          ) : (mains || []).length === 0 ? (
            <div className="text-sm text-muted-foreground">No main categories yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(mains || []).map((mc) => (
                  <TableRow key={mc.id}>
                    <TableCell className="font-medium">{mc.title}</TableCell>
                    <TableCell>{mc.priority ?? "-"}</TableCell>
                    <TableCell>{mc.status || "-"}</TableCell>
                    <TableCell className="text-muted-foreground max-w-md truncate">{mc.description || ""}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingMain(mc); setOpenMain(true); mainForm.reset({ title: mc.title, image: mc.image || "", priority: mc.priority, description: mc.description || "", status: mc.status || "" }); }}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMain.mutate(mc.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
          <CardTitle>Categories</CardTitle>
          <CardDescription>Second-level categories linked to a main category.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingCat ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
          ) : (cats || []).length === 0 ? (
            <div className="text-sm text-muted-foreground">No categories yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Main Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(cats || []).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell>{mains?.find((m) => m.id === c.mainCategoryId)?.title || "-"}</TableCell>
                    <TableCell>{c.priority ?? "-"}</TableCell>
                    <TableCell>{c.status || "-"}</TableCell>
                    <TableCell className="text-muted-foreground max-w-md truncate">{c.description || ""}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingCat(c); setOpenCat(true); catForm.reset({ title: c.title, image: c.image || "", priority: c.priority, description: c.description || "", status: c.status || "", mainCategoryId: c.mainCategoryId || "" }); }}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteCat.mutate(c.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Main Category Dialog */}
      <Dialog open={openMain} onOpenChange={(open) => { if (!open) resetMain(); else setOpenMain(true); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMain ? "Edit Main Category" : "Add Main Category"}</DialogTitle>
            <DialogDescription>Title, image URL, priority, description, status.</DialogDescription>
          </DialogHeader>
          <Form {...mainForm}>
            <form onSubmit={mainForm.handleSubmit(handleMainSubmit)} className="space-y-3">
              <FormField control={mainForm.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={mainForm.control} name="image" render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl><Input {...field} placeholder="https://..." /></FormControl>
                </FormItem>
              )} />
              <FormField control={mainForm.control} name="priority" render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={mainForm.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={mainForm.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea rows={3} {...field} /></FormControl>
                </FormItem>
              )} />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={resetMain}>Cancel</Button>
                <Button type="submit" disabled={createMain.isPending || updateMain.isPending}>
                  {(createMain.isPending || updateMain.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingMain ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={openCat} onOpenChange={(open) => { if (!open) resetCat(); else setOpenCat(true); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCat ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>Assign to a main category if needed.</DialogDescription>
          </DialogHeader>
          <Form {...catForm}>
            <form onSubmit={catForm.handleSubmit(handleCatSubmit)} className="space-y-3">
              <FormField control={catForm.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={catForm.control} name="image" render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl><Input {...field} placeholder="https://..." /></FormControl>
                </FormItem>
              )} />
              <FormField control={catForm.control} name="priority" render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={catForm.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={catForm.control} name="mainCategoryId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Main Category (optional)</FormLabel>
                  <FormControl>
                    <Input list="main-cat-list" placeholder="Main Category ID" {...field} />
                  </FormControl>
                  <datalist id="main-cat-list">
                    {(mains || []).map((m) => (
                      <option value={m.id} key={m.id}>{m.title}</option>
                    ))}
                  </datalist>
                </FormItem>
              )} />
              <FormField control={catForm.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea rows={3} {...field} /></FormControl>
                </FormItem>
              )} />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={resetCat}>Cancel</Button>
                <Button type="submit" disabled={createCat.isPending || updateCat.isPending}>
                  {(createCat.isPending || updateCat.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingCat ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

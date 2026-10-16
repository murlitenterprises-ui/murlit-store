import { createContext, useContext, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getCart, addToCart, updateQty, removeItem } from "@/fns/cart";

export type CartItem = Awaited<ReturnType<typeof getCart>>[number];

type CartContext = {
  items: CartItem[];
  count: number;
  isLoading: boolean;
  add: (productId: string, qty?: number) => Promise<void>;
  update: (itemId: string, qty: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  invalidate: () => void;
};

const Ctx = createContext<CartContext>({
  items: [],
  count: 0,
  isLoading: false,
  add: async () => {},
  update: async () => {},
  remove: async () => {},
  invalidate: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: () => getCart(),
    staleTime: 30_000,
    retry: 1,
  });

  const count = items.reduce((s, i) => s + i.qty, 0);

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["cart"] });
  }, [qc]);

  const addMut = useMutation({
    mutationFn: ({ productId, qty }: { productId: string; qty: number }) =>
      addToCart({ data: { productId, qty } }),
    onSuccess: (newItems) => qc.setQueryData(["cart"], newItems),
    onError: (e: any) => toast.error(e?.message ?? "Failed to add to cart"),
  });

  const updateMut = useMutation({
    mutationFn: ({ itemId, qty }: { itemId: string; qty: number }) =>
      updateQty({ data: { itemId, qty } }),
    onSuccess: (newItems) => qc.setQueryData(["cart"], newItems),
    onError: (e: any) => toast.error(e?.message ?? "Failed to update cart"),
  });

  const removeMut = useMutation({
    mutationFn: ({ itemId }: { itemId: string }) => removeItem({ data: { itemId } }),
    onSuccess: (newItems) => qc.setQueryData(["cart"], newItems),
    onError: (e: any) => toast.error(e?.message ?? "Failed to remove item"),
  });

  const add = useCallback(
    async (productId: string, qty = 1) => {
      await addMut.mutateAsync({ productId, qty });
      toast.success("Added to cart");
    },
    [addMut]
  );

  const update = useCallback(
    async (itemId: string, qty: number) => {
      await updateMut.mutateAsync({ itemId, qty });
    },
    [updateMut]
  );

  const remove = useCallback(
    async (itemId: string) => {
      await removeMut.mutateAsync({ itemId });
    },
    [removeMut]
  );

  return (
    <Ctx.Provider value={{ items, count, isLoading, add, update, remove, invalidate }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  return useContext(Ctx);
}

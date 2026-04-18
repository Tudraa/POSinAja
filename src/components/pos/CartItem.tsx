"use client";

import { formatRupiah } from "@/utils/format";
import { Trash2, Plus, Minus } from "lucide-react";

type CartItemData = {
  id: string;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  notes: string;
  cartId: string;
};

type CartItemProps = {
  item: CartItemData;
  onUpdateQuantity: (cartId: string, delta: number) => void;
  onRemove: (cartId: string) => void;
  onNotesChange: (cartId: string, notes: string) => void;
};

export default function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  onNotesChange,
}: CartItemProps) {
  return (
    <div className="bg-surface-container-low rounded-2xl p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-on-surface">{item.name}</h4>
          <p className="text-primary text-sm font-bold">
            {formatRupiah(item.price * item.quantity)}
          </p>
        </div>
        <button
          onClick={() => onRemove(item.cartId)}
          className="text-slate-400 hover:text-error transition-colors p-1"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Ex : No Sugar"
          value={item.notes}
          onChange={(e) => onNotesChange(item.cartId, e.target.value)}
          className="flex-1 text-xs bg-transparent border-b border-outline-variant/30 focus:border-primary focus:ring-0 px-0 py-1 italic focus:outline-none text-on-surface-variant"
        />
        <div className="flex items-center gap-3 bg-surface-container-lowest rounded-full px-2 py-1 shadow-sm">
          <button
            onClick={() => onUpdateQuantity(item.cartId, -1)}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors"
          >
            <Minus size={12} />
          </button>
          <span className="text-sm font-bold w-4 text-center">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.cartId, 1)}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-primary-container text-on-primary"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

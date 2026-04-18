"use client";

import { Banknote, QrCode, CreditCard } from "lucide-react";

type PaymentMethodSelectorProps = {
    selected: string;
    onSelect: (method: string) => void;
};

const methods = [
    { key: "CASH", label: "Cash", icon: Banknote },
    { key: "QRIS", label: "QRIS", icon: QrCode },
    { key: "DEBIT", label: "Debit", icon: CreditCard },
];

export default function PaymentMethodSelector({
    selected,
    onSelect,
}: PaymentMethodSelectorProps) {
    return (
        <div className="grid grid-cols-3 gap-3">
            {methods.map(({ key, label, icon: Icon }) => {
                const isActive = selected === key;
                return (
                    <button
                        key={key}
                        onClick={() => onSelect(key)}
                        className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all active:scale-95 ${isActive
                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                : "border border-slate-100 bg-white text-slate-400 hover:text-primary hover:border-primary/20"
                            }`}
                    >
                        <Icon size={24} />
                        <span className="text-[10px] font-bold tracking-widest uppercase">
                            {label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

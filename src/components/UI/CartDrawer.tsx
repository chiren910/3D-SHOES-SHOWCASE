import React, { useState } from 'react';
import { CheckCircle2, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, X, Zap } from 'lucide-react';
import { soundFX } from '../../utils/soundEngine';

export interface CartItem {
  uid: string;
  name: string;
  colorwayName: string;
  accentHex: string;
  sizeUS: string;
  price: number;
  quantity: number;
  engravingText?: string;
  customSummary?: string;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (uid: string, delta: number) => void;
  onRemove: (uid: string) => void;
  onClearCart: () => void;
  accentHex: string;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQty,
  onRemove,
  onClearCart,
  accentHex,
}) => {
  const [orderPlaced, setOrderPlaced] = useState(false);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    soundFX.playColorSwitch();
    setOrderPlaced(true);
    setTimeout(() => {
      onClearCart();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Content */}
      <div className="relative z-10 w-full max-w-md bg-[#090B12] border-l border-white/10 h-full flex flex-col justify-between p-6 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5" style={{ color: accentHex }} />
            <div>
              <h3 className="font-display text-lg font-bold tracking-wide text-white">
                ATELIER DISPATCH BAG
              </h3>
              <p className="text-[11px] font-mono text-white/45">
                BESPOKE 3D FOOTWEAR ALLOCATION
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-6 space-y-4">
          {orderPlaced ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                style={{
                  backgroundColor: `${accentHex}20`,
                  border: `1px solid ${accentHex}`,
                }}
              >
                <CheckCircle2 className="w-8 h-8" style={{ color: accentHex }} />
              </div>
              <span className="text-xs font-mono uppercase tracking-widest text-white/50 mb-2">
                PRODUCTION SLOT LOCKED // #AE-9042
              </span>
              <h4 className="font-display text-2xl font-bold text-white mb-3">
                BESPOKE BUILD CONFIRMED
              </h4>
              <p className="text-sm text-white/65 mb-8 leading-relaxed">
                Your custom 3D specification has been transmitted to our Carbon DLS & AeroWeave™
                manufacturing line.
              </p>
              <button
                onClick={() => {
                  setOrderPlaced(false);
                  onClose();
                }}
                className="px-6 py-3 rounded-full text-xs font-mono font-bold uppercase tracking-wider text-[#06070B]"
                style={{ backgroundColor: accentHex }}
              >
                Return to 3D Studio
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <ShoppingBag className="w-12 h-12 text-white/20 mb-4" />
              <p className="font-display text-lg text-white/75 mb-1">Your Dispatch Bag is Empty</p>
              <p className="text-xs text-white/45 max-w-xs mb-6">
                Configure your bespoke AETHER APEX-01 colorway and carbon specification in the 3D
                Atelier.
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-full text-xs font-mono uppercase tracking-wider border border-white/20 hover:border-white/50 text-white"
              >
                Explore 3D Models
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.uid}
                className="glass-panel rounded-2xl p-4 flex flex-col gap-3 border border-white/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-4 h-10 rounded-full shrink-0"
                      style={{
                        backgroundColor: item.accentHex,
                        boxShadow: `0 0 12px ${item.accentHex}88`,
                      }}
                    />
                    <div>
                      <h4 className="font-display font-bold text-sm text-white">{item.name}</h4>
                      <p className="text-xs font-mono text-white/60">
                        {item.colorwayName} • SIZE US {item.sizeUS}
                      </p>
                      {item.engravingText && (
                        <p className="text-[11px] font-mono mt-1" style={{ color: item.accentHex }}>
                          HEEL TAG: &ldquo;{item.engravingText}&rdquo;
                        </p>
                      )}
                      {item.customSummary && (
                        <p className="text-[11px] text-white/45 mt-0.5">{item.customSummary}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onRemove(item.uid)}
                    className="text-white/35 hover:text-rose-400 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2 bg-white/5 rounded-full px-2 py-1">
                    <button
                      onClick={() => onUpdateQty(item.uid, -1)}
                      className="p-1 text-white/60 hover:text-white"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-mono px-2">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQty(item.uid, 1)}
                      className="p-1 text-white/60 hover:text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="font-mono text-sm font-bold text-white">
                    ${(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {!orderPlaced && items.length > 0 && (
          <div className="pt-5 border-t border-white/10 space-y-4">
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-white/55">
                <span>AIRFREIGHT EXPRESS CARBON CASE</span>
                <span className="text-emerald-400">COMPLIMENTARY</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2">
                <span>TOTAL ALLOCATION</span>
                <span>${subtotal.toLocaleString()} USD</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full py-4 rounded-full font-mono text-xs font-bold uppercase tracking-widest text-[#06070B] flex items-center justify-center gap-2 transition-transform active:scale-98 shadow-xl"
              style={{
                backgroundColor: accentHex,
                boxShadow: `0 0 28px ${accentHex}55`,
              }}
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>CONFIRM BESPOKE ORDER</span>
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-white/45">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>NFC BLOCKCHAIN AUTHENTICATED • 30-DAY TRACK TRIAL</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

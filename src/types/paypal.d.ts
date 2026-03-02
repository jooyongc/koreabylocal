interface PayPalOrderData {
  id: string;
  status: string;
}

interface PayPalActions {
  order: {
    create: (data: {
      purchase_units: {
        amount: {
          value: string;
          currency_code?: string;
        };
        description?: string;
      }[];
    }) => Promise<string>;
    capture: () => Promise<PayPalOrderData>;
  };
}

interface PayPalButtonsComponent {
  render: (container: HTMLElement | string) => Promise<void>;
  close: () => Promise<void>;
  isEligible: () => boolean;
}

interface PayPalNamespace {
  Buttons: (options: {
    style?: {
      layout?: "vertical" | "horizontal";
      color?: "gold" | "blue" | "silver" | "white" | "black";
      shape?: "rect" | "pill";
      label?: "paypal" | "checkout" | "buynow" | "pay";
      height?: number;
    };
    createOrder: (data: unknown, actions: PayPalActions) => Promise<string>;
    onApprove: (data: PayPalOrderData, actions: PayPalActions) => Promise<void>;
    onError?: (err: unknown) => void;
    onCancel?: () => void;
  }) => PayPalButtonsComponent;
}

interface Window {
  paypal?: PayPalNamespace;
}

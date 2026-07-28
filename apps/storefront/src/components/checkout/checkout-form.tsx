"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkoutSchema, type CheckoutFormInput, type CheckoutInput } from "@bangla-blend/validation";
import type { Market } from "@bangla-blend/types";
import { formatMoney } from "@bangla-blend/commerce-client";
import { LockKeyhole, Gift, Truck, CreditCard } from "lucide-react";
import { useCart } from "@/providers/cart-provider";

interface CheckoutAvailability {
  checkoutEnabled: boolean;
  codEnabled: boolean;
  sslcommerzEnabled: boolean;
}

interface ShippingChoice { id: string; name: string; amount?: number; currencyCode: string }

export function CheckoutForm({ market, availability }: { market: Market; availability: CheckoutAvailability }) {
  const router = useRouter();
  const { cart } = useCart();
  const [serverError, setServerError] = useState<string>();
  const [shippingOptions, setShippingOptions] = useState<ShippingChoice[]>([]);
  const defaultPayment = market.domestic ? (availability.codEnabled ? "cod" : "sslcommerz") : "international";
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<CheckoutFormInput, unknown, CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { billingSameAsShipping: true, isGift: false, paymentMethod: defaultPayment, shippingAddress: { countryCode: market.code.toUpperCase() }, termsAccepted: false }
  });
  const isGift = watch("isGift");
  const billingSameAsShipping = watch("billingSameAsShipping");
  const paymentMethod = watch("paymentMethod");
  const billingToggle = register("billingSameAsShipping");
  const noDomesticPayment = market.domestic && !availability.codEnabled && !availability.sslcommerzEnabled;
  const canSubmit = availability.checkoutEnabled && !noDomesticPayment;

  return (
    <form className="checkout-grid" onSubmit={handleSubmit(async (input) => {
      setServerError(undefined);
      if (!canSubmit) { setServerError("Checkout is not enabled for this destination."); return; }
      const response = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
      const payload = (await response.json()) as { redirect?: string; error?: string; requiresShippingSelection?: boolean; shippingOptions?: ShippingChoice[] };
      if (payload.requiresShippingSelection && payload.shippingOptions?.length) {
        setShippingOptions(payload.shippingOptions);
        setValue("shippingOptionId", payload.shippingOptions[0]!.id, { shouldValidate: true });
        setServerError("Choose a delivery method, then submit the order again.");
        return;
      }
      if (!response.ok || !payload.redirect) { setServerError(payload.error ?? "Checkout failed."); return; }
      if (payload.redirect.startsWith("http")) window.location.assign(payload.redirect); else router.push(payload.redirect);
    })} noValidate>
      <div className="checkout-main">
        {!availability.checkoutEnabled ? <div className="verification-notice" role="status"><LockKeyhole size={22} /><p><strong>Browsing is available, but checkout is not yet open for {market.label}.</strong> Payment, carrier, export and returns operations must be approved before orders can be accepted.</p></div> : null}

        <section className="checkout-card">
          <div className="checkout-step"><span>1</span><div><h3>Contact</h3><p>Order and delivery updates</p></div></div>
          <div className="field"><label htmlFor="checkout-email">Email address</label><input id="checkout-email" className="input" type="email" autoComplete="email" {...register("email")} aria-invalid={Boolean(errors.email)} />{errors.email ? <span className="field-error">{errors.email.message}</span> : null}</div>
        </section>

        <section className="checkout-card">
          <div className="checkout-step"><span>2</span><div><h3>Delivery address</h3><p>Shipping options are confirmed from this address</p></div></div>
          <div className="form-grid two">
            <Field label="First name" error={errors.shippingAddress?.firstName?.message}><input className="input" autoComplete="given-name" {...register("shippingAddress.firstName")} aria-invalid={Boolean(errors.shippingAddress?.firstName)} /></Field>
            <Field label="Last name" error={errors.shippingAddress?.lastName?.message}><input className="input" autoComplete="family-name" {...register("shippingAddress.lastName")} aria-invalid={Boolean(errors.shippingAddress?.lastName)} /></Field>
            <Field label="Address" error={errors.shippingAddress?.address1?.message} wide><input className="input" autoComplete="address-line1" {...register("shippingAddress.address1")} aria-invalid={Boolean(errors.shippingAddress?.address1)} /></Field>
            <Field label="Apartment, suite or area" wide><input className="input" autoComplete="address-line2" {...register("shippingAddress.address2")} /></Field>
            <Field label="City" error={errors.shippingAddress?.city?.message}><input className="input" autoComplete="address-level2" {...register("shippingAddress.city")} aria-invalid={Boolean(errors.shippingAddress?.city)} /></Field>
            <Field label={market.domestic ? "District" : "State / province"}><input className="input" autoComplete="address-level1" {...register("shippingAddress.province")} /></Field>
            <Field label="Postal code"><input className="input" autoComplete="postal-code" {...register("shippingAddress.postalCode")} /></Field>
            <Field label="Country code" error={errors.shippingAddress?.countryCode?.message}><input className="input" autoComplete="country" readOnly aria-readonly="true" {...register("shippingAddress.countryCode")} /></Field>
            <Field label="Telephone" error={errors.shippingAddress?.phone?.message} wide><input className="input" type="tel" autoComplete="tel" {...register("shippingAddress.phone")} aria-invalid={Boolean(errors.shippingAddress?.phone)} /></Field>
          </div>
        </section>

        {shippingOptions.length ? <section className="checkout-card">
          <div className="checkout-step"><span><Truck size={18} /></span><div><h3>Delivery method</h3><p>Available services for this address</p></div></div>
          <div className="payment-options">{shippingOptions.map((option) => <label key={option.id}><input type="radio" value={option.id} {...register("shippingOptionId")} /><Truck /><span><strong>{option.name}</strong><small>{typeof option.amount === "number" ? formatMoney(option.amount, option.currencyCode) : "Calculated by the carrier"}</small></span></label>)}</div>
        </section> : null}

        <section className="checkout-card">
          <div className="checkout-step"><span>3</span><div><h3>Billing address</h3><p>Keep billing and delivery details separate when needed</p></div></div>
          <label className="check-row"><input type="checkbox" {...billingToggle} onChange={(event) => { void billingToggle.onChange(event); if (!event.target.checked) setValue("billingAddress.countryCode", market.code.toUpperCase()); }} /><span>Billing address is the same as delivery</span></label>
          {!billingSameAsShipping ? <div className="form-grid two billing-fields">
            <Field label="First name" error={errors.billingAddress?.firstName?.message}><input className="input" autoComplete="billing given-name" {...register("billingAddress.firstName")} /></Field>
            <Field label="Last name" error={errors.billingAddress?.lastName?.message}><input className="input" autoComplete="billing family-name" {...register("billingAddress.lastName")} /></Field>
            <Field label="Address" error={errors.billingAddress?.address1?.message} wide><input className="input" autoComplete="billing address-line1" {...register("billingAddress.address1")} /></Field>
            <Field label="Apartment, suite or area" wide><input className="input" autoComplete="billing address-line2" {...register("billingAddress.address2")} /></Field>
            <Field label="City" error={errors.billingAddress?.city?.message}><input className="input" autoComplete="billing address-level2" {...register("billingAddress.city")} /></Field>
            <Field label={market.domestic ? "District" : "State / province"}><input className="input" autoComplete="billing address-level1" {...register("billingAddress.province")} /></Field>
            <Field label="Postal code"><input className="input" autoComplete="billing postal-code" {...register("billingAddress.postalCode")} /></Field>
            <Field label="Country code" error={errors.billingAddress?.countryCode?.message}><input className="input" autoComplete="billing country" maxLength={2} {...register("billingAddress.countryCode")} /></Field>
            <Field label="Telephone" error={errors.billingAddress?.phone?.message} wide><input className="input" type="tel" autoComplete="billing tel" {...register("billingAddress.phone")} /></Field>
          </div> : null}
        </section>

        <section className="checkout-card">
          <div className="checkout-step"><span><Gift size={18} /></span><div><h3>Gift options</h3><p>Buy here, deliver to someone you care about</p></div></div>
          <label className="check-row"><input type="checkbox" {...register("isGift")} /><span>This order is a gift</span></label>
          {isGift ? <div className="form-grid two gift-fields">
            <Field label="Recipient name" error={errors.recipient?.name?.message}><input className="input" autoComplete="name" {...register("recipient.name")} /></Field>
            <Field label="Recipient telephone" error={errors.recipient?.telephone?.message}><input className="input" type="tel" autoComplete="tel" {...register("recipient.telephone")} /></Field>
            <Field label="Gift message" wide><textarea className="textarea" {...register("recipient.message")} /></Field>
            <Field label="Preferred delivery date"><input className="input" type="date" {...register("recipient.preferredDeliveryDate")} /></Field>
            <label className="check-row"><input type="checkbox" {...register("recipient.hidePrices")} /><span>Hide prices in the parcel</span></label>
            <Field label="Delivery instructions" wide><textarea className="textarea" {...register("recipient.instructions")} /></Field>
          </div> : null}
        </section>

        <section className="checkout-card">
          <div className="checkout-step"><span>4</span><div><h3>Payment</h3><p>Methods configured for {market.label}</p></div></div>
          <div className="payment-options">
            {market.domestic ? <>
              {availability.codEnabled ? <label><input type="radio" value="cod" {...register("paymentMethod")} /><Truck /><span><strong>Cash on Delivery</strong><small>Pay when the order arrives where available</small></span></label> : null}
              {availability.sslcommerzEnabled ? <label><input type="radio" value="sslcommerz" {...register("paymentMethod")} /><CreditCard /><span><strong>SSLCOMMERZ</strong><small>Secure hosted payment · server validation required</small></span></label> : null}
              {noDomesticPayment ? <p className="form-error">No payment method is currently enabled.</p> : null}
            </> : <label><input type="radio" value="international" {...register("paymentMethod")} disabled={!availability.checkoutEnabled} /><CreditCard /><span><strong>International payment</strong><small>Configured provider for {market.label}</small></span></label>}
          </div>
          {errors.paymentMethod ? <span className="field-error">{errors.paymentMethod.message}</span> : null}
        </section>
      </div>

      <aside className="checkout-review">
        <span className="eyebrow">Review</span><h3>Order summary</h3>
        {cart?.items.length ? <div className="checkout-summary-lines">{cart.items.map((line) => <div key={line.id}><span>{line.quantity} × {line.title}</span><strong>{formatMoney(line.total, cart.currencyCode.toUpperCase())}</strong></div>)}<div className="checkout-summary-total"><span>Current total</span><strong>{formatMoney(cart.total, cart.currencyCode.toUpperCase())}</strong></div><p>Delivery and final taxes update from the address and method selected.</p></div> : <p>Your cart summary could not be loaded. Return to the cart before submitting.</p>}
        <ul><li><Truck size={17} /> Destination-aware delivery</li><li><Gift size={17} /> Separate recipient details</li><li><LockKeyhole size={17} /> Server-validated payment</li></ul>
        {!market.domestic ? <p className="duties-box">{market.dutiesMessage}</p> : null}
        <label className="check-row terms"><input type="checkbox" {...register("termsAccepted")} /><span>I agree to the <Link href="/legal/terms-and-conditions" target="_blank" rel="noopener noreferrer">terms and conditions</Link>.</span></label>
        {errors.termsAccepted ? <span className="field-error">Please accept the terms.</span> : null}
        {serverError ? <p className="form-error" role="alert">{serverError}</p> : null}
        <button className="button button-primary" disabled={isSubmitting || !canSubmit || !cart?.items.length}>{isSubmitting ? "Submitting securely…" : paymentMethod === "cod" ? "Place order" : "Continue to secure payment"}</button>
        <p className="secure-note"><LockKeyhole size={14} /> Payment is never confirmed from a browser redirect alone.</p>
      </aside>
    </form>
  );
}

function Field({ label, error, wide = false, children }: { label: string; error?: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={`field${wide ? " wide" : ""}`}><span className="field-label">{label}</span>{children}{error ? <span className="field-error">{error}</span> : null}</label>;
}

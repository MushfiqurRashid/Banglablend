"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  checkoutSchema,
  type CheckoutFormInput,
  type CheckoutInput,
} from "@bangla-blend/validation";
import type { Market } from "@bangla-blend/types";
import { formatMoney } from "@bangla-blend/commerce-client";
import {
  ArrowRight,
  CreditCard,
  Gift,
  Globe2,
  LoaderCircle,
  LockKeyhole,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { useCart } from "@/providers/cart-provider";
import { INTERNATIONAL_SHIPPING_OPTION_ID } from "@/config/shipping";

interface CheckoutAvailability {
  checkoutEnabled: boolean;
  codEnabled: boolean;
  sslcommerzEnabled: boolean;
}

export interface ShippingChoice {
  id: string;
  name: string;
  amount: number;
  currencyCode: string;
}

export function CheckoutForm({
  market,
  availability,
  shippingOptions: initialShippingOptions,
}: {
  market: Market;
  availability: CheckoutAvailability;
  shippingOptions: ShippingChoice[];
}) {
  const { cart, resetCart, isLoading: cartIsLoading } = useCart();
  const [serverError, setServerError] = useState<string>();
  const [shippingOptions, setShippingOptions] = useState<ShippingChoice[]>(initialShippingOptions);
  const defaultPayment = market.domestic ? undefined : "international";
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormInput, unknown, CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      billingSameAsShipping: true,
      isGift: false,
      paymentMethod: defaultPayment,
      shippingOptionId: initialShippingOptions.length === 1 ? initialShippingOptions[0]?.id : undefined,
      shippingAddress: { countryCode: market.code.toUpperCase() },
      termsAccepted: false,
    },
  });
  const isGift = watch("isGift");
  const billingSameAsShipping = watch("billingSameAsShipping");
  const paymentMethod = watch("paymentMethod");
  const shippingOptionId = watch("shippingOptionId");
  const selectedShippingOption = shippingOptions.find((option) => option.id === shippingOptionId);
  const internationalDelivery = shippingOptionId === INTERNATIONAL_SHIPPING_OPTION_ID;
  const displayedShippingOptions = [
    ...shippingOptions.filter((option) => option.id !== INTERNATIONAL_SHIPPING_OPTION_ID),
    ...shippingOptions.filter((option) => option.id === INTERNATIONAL_SHIPPING_OPTION_ID),
  ];
  const billingToggle = register("billingSameAsShipping");
  const shippingOptionRegistration = register("shippingOptionId", {
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(
        "shippingAddress.countryCode",
        event.target.value === INTERNATIONAL_SHIPPING_OPTION_ID ? "" : market.code.toUpperCase(),
      );
    },
  });
  const noDomesticPayment =
    market.domestic && !availability.codEnabled && !availability.sslcommerzEnabled;
  const canSubmit = availability.checkoutEnabled && !noDomesticPayment;
  const showDeliveryAreas =
    market.domestic && Boolean(paymentMethod) && shippingOptions.length > 0;

  return (
    <form
      className="checkout-grid"
      onSubmit={handleSubmit(async (input) => {
        setServerError(undefined);
        if (!canSubmit) {
          setServerError("Checkout is not enabled for this destination.");
          return;
        }
        if (shippingOptions.length > 1 && !input.shippingOptionId) {
          setServerError("Choose a delivery method before placing the order.");
          return;
        }
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input),
        });
        const payload = (await response.json()) as {
          redirect?: string;
          error?: string;
          requiresShippingSelection?: boolean;
          shippingOptions?: ShippingChoice[];
        };
        if (payload.requiresShippingSelection && payload.shippingOptions?.length) {
          setShippingOptions(payload.shippingOptions);
          setServerError("Choose a delivery area, then submit the order again.");
          return;
        }
        if (!response.ok || !payload.redirect) {
          setServerError(payload.error ?? "Checkout failed.");
          return;
        }
        if (!payload.redirect.startsWith("http")) resetCart();
        window.location.assign(payload.redirect);
      })}
      noValidate
    >
      <div className="checkout-main">
        {!availability.checkoutEnabled ? (
          <div className="verification-notice" role="status">
            <LockKeyhole size={22} />
            <p>
              <strong>
                Browsing is available, but checkout is not yet open for {market.label}.
              </strong>{" "}
              Payment, carrier, export and returns operations must be approved before orders can be
              accepted.
            </p>
          </div>
        ) : null}

        <section className="checkout-card">
          <div className="checkout-step">
            <span>1</span>
            <div>
              <h2>Contact</h2>
              <p>Order and delivery updates</p>
            </div>
          </div>
          <div className="field">
            <label htmlFor="checkout-email">Email address</label>
            <input
              id="checkout-email"
              className="input"
              type="email"
              autoComplete="email"
              {...register("email")}
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email ? <span className="field-error">{errors.email.message}</span> : null}
          </div>
        </section>

        <section className="checkout-card">
          <div className="checkout-step">
            <span>2</span>
            <div>
              <h2>Delivery address</h2>
              <p>Shipping options are confirmed from this address</p>
            </div>
          </div>
          <div className="form-grid two">
            <Field label="First name" error={errors.shippingAddress?.firstName?.message}>
              <input
                className="input"
                autoComplete="given-name"
                {...register("shippingAddress.firstName")}
                aria-invalid={Boolean(errors.shippingAddress?.firstName)}
              />
            </Field>
            <Field label="Last name" error={errors.shippingAddress?.lastName?.message}>
              <input
                className="input"
                autoComplete="family-name"
                {...register("shippingAddress.lastName")}
                aria-invalid={Boolean(errors.shippingAddress?.lastName)}
              />
            </Field>
            <Field label="Address" error={errors.shippingAddress?.address1?.message} wide>
              <input
                className="input"
                autoComplete="address-line1"
                {...register("shippingAddress.address1")}
                aria-invalid={Boolean(errors.shippingAddress?.address1)}
              />
            </Field>
            <Field label="Apartment, suite or area" wide>
              <input
                className="input"
                autoComplete="address-line2"
                {...register("shippingAddress.address2")}
              />
            </Field>
            <Field label="City" error={errors.shippingAddress?.city?.message}>
              <input
                className="input"
                autoComplete="address-level2"
                {...register("shippingAddress.city")}
                aria-invalid={Boolean(errors.shippingAddress?.city)}
              />
            </Field>
            <Field label={market.domestic ? "District" : "State / province"}>
              <input
                className="input"
                autoComplete="address-level1"
                {...register("shippingAddress.province")}
              />
            </Field>
            <Field label="Postal code">
              <input
                className="input"
                autoComplete="postal-code"
                {...register("shippingAddress.postalCode")}
              />
            </Field>
            <Field label="Country code" error={errors.shippingAddress?.countryCode?.message}>
              <input
                className="input"
                autoComplete="country"
                maxLength={2}
                readOnly={!internationalDelivery}
                aria-readonly={!internationalDelivery}
                {...register("shippingAddress.countryCode")}
              />
            </Field>
            <Field label="Telephone" error={errors.shippingAddress?.phone?.message} wide>
              <input
                className="input"
                type="tel"
                autoComplete="tel"
                {...register("shippingAddress.phone")}
                aria-invalid={Boolean(errors.shippingAddress?.phone)}
              />
            </Field>
          </div>
        </section>

        <section className="checkout-card">
          <div className="checkout-step">
            <span>3</span>
            <div>
              <h2>Billing address</h2>
              <p>Keep billing and delivery details separate when needed</p>
            </div>
          </div>
          <label className="check-row">
            <input
              type="checkbox"
              {...billingToggle}
              onChange={(event) => {
                void billingToggle.onChange(event);
                if (!event.target.checked)
                  setValue("billingAddress.countryCode", market.code.toUpperCase());
              }}
            />
            <span>Billing address is the same as delivery</span>
          </label>
          {!billingSameAsShipping ? (
            <div className="form-grid two billing-fields">
              <Field label="First name" error={errors.billingAddress?.firstName?.message}>
                <input
                  className="input"
                  autoComplete="billing given-name"
                  {...register("billingAddress.firstName")}
                />
              </Field>
              <Field label="Last name" error={errors.billingAddress?.lastName?.message}>
                <input
                  className="input"
                  autoComplete="billing family-name"
                  {...register("billingAddress.lastName")}
                />
              </Field>
              <Field label="Address" error={errors.billingAddress?.address1?.message} wide>
                <input
                  className="input"
                  autoComplete="billing address-line1"
                  {...register("billingAddress.address1")}
                />
              </Field>
              <Field label="Apartment, suite or area" wide>
                <input
                  className="input"
                  autoComplete="billing address-line2"
                  {...register("billingAddress.address2")}
                />
              </Field>
              <Field label="City" error={errors.billingAddress?.city?.message}>
                <input
                  className="input"
                  autoComplete="billing address-level2"
                  {...register("billingAddress.city")}
                />
              </Field>
              <Field label={market.domestic ? "District" : "State / province"}>
                <input
                  className="input"
                  autoComplete="billing address-level1"
                  {...register("billingAddress.province")}
                />
              </Field>
              <Field label="Postal code">
                <input
                  className="input"
                  autoComplete="billing postal-code"
                  {...register("billingAddress.postalCode")}
                />
              </Field>
              <Field label="Country code" error={errors.billingAddress?.countryCode?.message}>
                <input
                  className="input"
                  autoComplete="billing country"
                  maxLength={2}
                  {...register("billingAddress.countryCode")}
                />
              </Field>
              <Field label="Telephone" error={errors.billingAddress?.phone?.message} wide>
                <input
                  className="input"
                  type="tel"
                  autoComplete="billing tel"
                  {...register("billingAddress.phone")}
                />
              </Field>
            </div>
          ) : null}
        </section>

        <section className="checkout-card">
          <div className="checkout-step">
            <span>
              <Gift size={18} />
            </span>
            <div>
              <h2>Gift options</h2>
              <p>Buy here, deliver to someone you care about</p>
            </div>
          </div>
          <label className="check-row">
            <input type="checkbox" {...register("isGift")} />
            <span>This order is a gift</span>
          </label>
          {isGift ? (
            <div className="form-grid two gift-fields">
              <Field label="Recipient name" error={errors.recipient?.name?.message}>
                <input className="input" autoComplete="name" {...register("recipient.name")} />
              </Field>
              <Field label="Recipient telephone" error={errors.recipient?.telephone?.message}>
                <input
                  className="input"
                  type="tel"
                  autoComplete="tel"
                  {...register("recipient.telephone")}
                />
              </Field>
              <Field label="Gift message" wide>
                <textarea className="textarea" {...register("recipient.message")} />
              </Field>
              <Field label="Preferred delivery date">
                <input
                  className="input"
                  type="date"
                  {...register("recipient.preferredDeliveryDate")}
                />
              </Field>
              <label className="check-row">
                <input type="checkbox" {...register("recipient.hidePrices")} />
                <span>Hide prices in the parcel</span>
              </label>
              <Field label="Delivery instructions" wide>
                <textarea className="textarea" {...register("recipient.instructions")} />
              </Field>
            </div>
          ) : null}
        </section>

        <section className="checkout-card">
          <div className="checkout-step">
            <span>4</span>
            <div>
              <h2>Payment</h2>
              <p>Methods configured for {market.label}</p>
            </div>
          </div>
          <div className="payment-options">
            {market.domestic ? (
              <>
                {availability.codEnabled ? (
                  <label>
                    <input type="radio" value="cod" {...register("paymentMethod")} />
                    <Truck />
                    <span>
                      <strong>Cash on Delivery</strong>
                      <small>Pay when the order arrives where available</small>
                    </span>
                  </label>
                ) : null}
                {availability.sslcommerzEnabled ? (
                  <label>
                    <input type="radio" value="sslcommerz" {...register("paymentMethod")} />
                    <CreditCard />
                    <span>
                      <strong>SSLCOMMERZ</strong>
                      <small>Secure hosted payment · server validation required</small>
                    </span>
                  </label>
                ) : null}
                {noDomesticPayment ? (
                  <p className="form-error">No payment method is currently enabled.</p>
                ) : null}
              </>
            ) : (
              <label>
                <input
                  type="radio"
                  value="international"
                  {...register("paymentMethod")}
                  disabled={!availability.checkoutEnabled}
                />
                <CreditCard />
                <span>
                  <strong>International payment</strong>
                  <small>Configured provider for {market.label}</small>
                </span>
              </label>
            )}
          </div>
          {errors.paymentMethod ? (
            <span className="field-error">{errors.paymentMethod.message}</span>
          ) : null}
          {showDeliveryAreas ? (
            <div className="checkout-delivery-areas">
              <div className="checkout-delivery-heading">
                <h3>Delivery method</h3>
                <p>Choose your delivery area. Local charges will be added to your order total.</p>
              </div>
              <div className="payment-options checkout-delivery-options">
                {displayedShippingOptions.map((option) => {
                  const isInternational = option.id === INTERNATIONAL_SHIPPING_OPTION_ID;
                  return (
                    <label
                      className={isInternational ? "checkout-international-option" : undefined}
                      key={option.id}
                    >
                      <input
                        type="radio"
                        value={option.id}
                        required={shippingOptions.length > 1}
                        {...shippingOptionRegistration}
                      />
                      {isInternational ? <Globe2 /> : <Truck />}
                      <span>
                        <strong>{option.name}</strong>
                        <small>
                          {isInternational
                            ? "We will contact shortly"
                            : `${formatMoney(option.amount, option.currencyCode)} delivery charge`}
                        </small>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <aside className="checkout-review">
        <div className="checkout-review-heading">
          <div>
            <span className="eyebrow">Your bag</span>
            <h2>Order summary</h2>
          </div>
          {cart?.items.length ? (
            <span className="checkout-item-count">
              {cart.items.reduce((total, line) => total + line.quantity, 0)} items
            </span>
          ) : null}
        </div>
        {cartIsLoading && !cart ? (
          <div className="checkout-summary-loading" role="status">
            <LoaderCircle size={19} aria-hidden="true" /> Loading your bag...
          </div>
        ) : cart?.items.length ? (
          <>
            <div className="checkout-products">
              {cart.items.map((line) => (
                <article className="checkout-product" key={line.id}>
                  <div className="checkout-product-art">
                    {line.thumbnail ? (
                      <Image
                        src={line.thumbnail}
                        alt=""
                        fill
                        sizes="72px"
                        unoptimized={line.thumbnail.startsWith("http")}
                      />
                    ) : (
                      <ShoppingBag size={20} aria-hidden="true" />
                    )}
                    <span>{line.quantity}</span>
                  </div>
                  <div className="checkout-product-copy">
                    <strong>{line.title}</strong>
                    {line.variantTitle ? <small>{line.variantTitle}</small> : null}
                  </div>
                  <strong className="checkout-product-price">
                    {formatMoney(line.total, cart.currencyCode.toUpperCase())}
                  </strong>
                </article>
              ))}
            </div>
            <div className="checkout-summary-lines">
              <div>
                <span>Subtotal</span>
                <strong>{formatMoney(cart.subtotal, cart.currencyCode.toUpperCase())}</strong>
              </div>
              {cart.discountTotal ? (
                <div className="checkout-summary-discount">
                  <span>Discount</span>
                  <strong>
                    -{formatMoney(cart.discountTotal, cart.currencyCode.toUpperCase())}
                  </strong>
                </div>
              ) : null}
              <div>
                <span>Delivery</span>
                <strong>
                  {selectedShippingOption
                    ? internationalDelivery
                      ? "No charge added"
                      : formatMoney(selectedShippingOption.amount, cart.currencyCode.toUpperCase())
                    : paymentMethod
                      ? "Choose delivery area"
                      : "Choose payment method"}
                </strong>
              </div>
              <div className="checkout-summary-total">
                <span>Estimated total</span>
                <strong>
                  {formatMoney(
                    cart.total - cart.shippingTotal + (selectedShippingOption?.amount ?? 0),
                    cart.currencyCode.toUpperCase(),
                  )}
                </strong>
              </div>
              <p>
                {internationalDelivery
                  ? "International delivery will be arranged after we contact you."
                  : "The selected delivery charge is included in this estimated total."}
              </p>
            </div>
          </>
        ) : (
          <div className="checkout-empty-summary">
            <span aria-hidden="true">
              <ShoppingBag size={21} />
            </span>
            <div>
              <strong>Your shopping bag is empty</strong>
              <p>Add a blend or gift before checking out.</p>
            </div>
            <Link href="/shop">
              Explore the collection <ArrowRight size={14} />
            </Link>
          </div>
        )}
        <ul className="checkout-assurances">
          <li>
            <Truck size={17} /> Delivery matched to your destination
          </li>
          <li>
            <Gift size={17} /> Separate recipient details
          </li>
          <li>
            <LockKeyhole size={17} /> Payment verified by our server
          </li>
        </ul>
        {!market.domestic ? <p className="duties-box">{market.dutiesMessage}</p> : null}
        <label className="check-row terms">
          <input type="checkbox" {...register("termsAccepted")} />
          <span>
            I agree to the{" "}
            <Link href="/legal/terms-and-conditions" target="_blank" rel="noopener noreferrer">
              terms and conditions
            </Link>
            .
          </span>
        </label>
        {errors.termsAccepted ? (
          <span className="field-error">Please accept the terms.</span>
        ) : null}
        {serverError ? (
          <p className="form-error" role="alert">
            {serverError}
          </p>
        ) : null}
        <button
          type="submit"
          className="button button-primary"
          disabled={isSubmitting || !canSubmit || !cart?.items.length || !paymentMethod}
        >
          {isSubmitting ? (
            <LoaderCircle className="checkout-spinner" size={17} aria-hidden="true" />
          ) : (
            <LockKeyhole size={16} aria-hidden="true" />
          )}
          {isSubmitting
            ? "Submitting securely..."
            : !paymentMethod
              ? "Choose payment method"
              : paymentMethod === "cod"
                ? "Place order"
                : "Continue to payment"}
        </button>
        <p className="secure-note">
          <LockKeyhole size={13} aria-hidden="true" /> Payment confirmation is verified securely.
        </p>
      </aside>
    </form>
  );
}

function Field({
  label,
  error,
  wide = false,
  children,
}: {
  label: string;
  error?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`field${wide ? "wide" : ""}`}>
      <span className="field-label">{label}</span>
      {children}
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const sig = request.headers.get("stripe-signature");

    // In demo mode without Stripe, just acknowledge
    if (!process.env.STRIPE_SECRET_KEY || !sig) {
      return NextResponse.json({ received: true, mode: "demo" });
    }

    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const { prisma } = await import("@/lib/prisma");

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const serviceIds = JSON.parse(session.metadata?.items || "[]");

        if (userId && serviceIds.length > 0) {
          for (const serviceId of serviceIds) {
            const service = await prisma.service.findUnique({
              where: { id: serviceId },
              select: { price: true, discountPrice: true },
            });
            if (!service) continue;

            const price = Number(service.discountPrice || service.price);
            const total = price;
            const fee = Math.round(total * 0.05);

            const booking = await prisma.booking.create({
              data: {
                userId,
                serviceId,
                checkIn: new Date(),
                checkOut: new Date(Date.now() + 86400000),
                guests: 1,
                totalPrice: total,
                serviceFee: fee,
                status: "CONFIRMED",
              },
            });

            await prisma.payment.create({
              data: {
                bookingId: booking.id,
                amount: total + fee,
                method: "CARD",
                status: "COMPLETED",
                transactionId: session.payment_intent || session.id,
                paidAt: new Date(),
              },
            });
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        console.error("Payment failed:", intent.id, intent.last_payment_error?.message);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const paymentIntent = charge.payment_intent;
        if (paymentIntent) {
          await prisma.payment.updateMany({
            where: { transactionId: paymentIntent },
            data: { status: "REFUNDED" },
          });
          const payment = await prisma.payment.findFirst({
            where: { transactionId: paymentIntent },
            select: { bookingId: true },
          });
          if (payment) {
            await prisma.booking.update({
              where: { id: payment.bookingId },
              data: { status: "REFUNDED" },
            });
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}

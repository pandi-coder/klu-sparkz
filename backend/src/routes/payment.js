const router = require('express').Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── CREATE ORDER ─────────────────────────────────────────────────────────────
router.post('/create-order', authenticate, async(req, res) => {
    try {
        const { event_id, amount } = req.body;

        // amount is in rupees — Razorpay needs paise (multiply by 100)
        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100),
            currency: 'INR',
            receipt: `receipt_${event_id}_${req.user.id}_${Date.now()}`,
            notes: {
                event_id,
                student_id: req.user.id,
            },
        });

        res.json({
            success: true,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID,
        });
    } catch (err) {
        console.error('Create order error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── VERIFY PAYMENT ───────────────────────────────────────────────────────────
router.post('/verify', authenticate, async(req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            event_id,
        } = req.body;

        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expected = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expected !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        // Get event details
        const { data: event } = await supabase
            .from('events').select('*').eq('id', event_id).single();

        // Create registration after successful payment
        const { data: reg, error } = await supabase
            .from('registrations').insert({
                event_id,
                student_id: req.user.id,
                payment_status: 'Paid',
                payment_mode: 'Razorpay',
                amount: event.fee,
                transaction_id: razorpay_payment_id,
            }).select().single();

        if (error) throw error;

        // Increment event registered count
        await supabase
            .from('events')
            .update({ registered_count: event.registered_count + 1 })
            .eq('id', event_id);

        // Send notification to student
        await supabase.from('notifications').insert({
            user_id: req.user.id,
            message: `Payment successful! You are registered for "${event.title}" 🎉`,
            type: 'success',
        });

        res.json({ success: true, data: reg, message: 'Payment verified and registration confirmed!' });
    } catch (err) {
        console.error('Verify payment error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
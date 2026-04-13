-- Function to increment shares count
CREATE OR REPLACE FUNCTION increment_shares(coupon_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE coupons
  SET shares = COALESCE(shares, 0) + 1
  WHERE id = coupon_id;
END;
$$;

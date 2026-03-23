echo "=== contexts/ içeriği ==="
ls -la contexts/

echo ""
echo "=== CourierContext.tsx ilk 5 satır ==="
head -5 contexts/CourierContext.tsx

echo ""
echo "=== CourierContext.tsx son 5 satır ==="
tail -5 contexts/CourierContext.tsx

echo ""
echo "=== CourierContext.tsx boyutu ==="
wc -l contexts/CourierContext.tsx

echo ""
echo "=== Sadece CourierContext hatası ==="
npx tsc --noEmit 2>&1 | grep "CourierContext.tsx"

echo ""
echo "=== constants/ içeriği ==="
ls -la constants/

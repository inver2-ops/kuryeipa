echo "=== tsconfig.json içeriği ==="
cat tsconfig.json
echo ""
echo "=== contexts klasörü ==="
ls -la contexts/
echo ""
echo "=== CourierContext ilk satır ==="
head -1 contexts/CourierContext.tsx
echo ""
echo "=== node_modules/@types/react var mı ==="
ls node_modules/@types/react/index.d.ts 2>/dev/null && echo "VAR" || echo "YOK"
echo ""
echo "=== TypeScript versiyonu ==="
npx tsc --version
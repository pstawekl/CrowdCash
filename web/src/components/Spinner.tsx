// Spinner.tsx
export default function Spinner() {
    return (
        <div className="flex justify-center items-center py-8">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" role="status" aria-label="Ładowanie" />
        </div>
    );
}

interface FooterProps {
  isExpanded: boolean;
}

export default function Footer({ isExpanded }: FooterProps) {
  if (!isExpanded) return null;

  return (
    <div className="p-6 mt-auto border-t border-gray-50 animate-in fade-in duration-500">
      <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest leading-loose">
        BAKAWAN Data Analytics v2.0
      </p>
      <p className="text-[10px] font-bold text-gray-400 mt-1">
        © 2026 All Rights Reserved
      </p>
    </div>
  );
}
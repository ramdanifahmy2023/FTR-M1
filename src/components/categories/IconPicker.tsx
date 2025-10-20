import React, { useState, useMemo } from 'react';
import { Search, Smile } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DynamicIcon, availableIcons, isValidIconName } from "@/components/ui/dynamic-icon"; // <-- Import dari dynamic-icon
import { cn } from '@/lib/utils';

interface IconPickerProps {
  value?: string | null;
  onChange: (iconName: string) => void;
  defaultValue?: string; // Opsional: ikon default jika value null/kosong
}

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange, defaultValue = 'Tag' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const currentIconName = (value && isValidIconName(value)) ? value : defaultValue;

  const filteredIcons = useMemo(() => {
    if (!search) {
      return availableIcons;
    }
    const lowerCaseSearch = search.toLowerCase();
    return availableIcons.filter(iconName =>
      iconName.toLowerCase().includes(lowerCaseSearch)
    );
  }, [search]);

  const handleIconSelect = (iconName: string) => {
    onChange(iconName);
    setIsOpen(false); // Tutup popover setelah memilih
    setSearch(''); // Reset search
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          aria-label="Pilih ikon"
        >
          <DynamicIcon name={currentIconName} className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
             {currentIconName}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0"> {/* <-- Sesuaikan lebar & hapus padding default */}
        <div className="p-2 border-b"> {/* <-- Area search */}
          <div className="relative">
             <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
             <Input
                placeholder="Cari ikon..."
                className="pl-8 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
             />
          </div>
        </div>
        <ScrollArea className="h-64"> {/* <-- Area scroll untuk grid ikon */}
          <div className="grid grid-cols-6 gap-1 p-2">
            {filteredIcons.length > 0 ? (
                filteredIcons.map((iconName) => (
                  <Button
                    key={iconName}
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "h-10 w-10 rounded-md", // Ukuran tombol ikon
                         currentIconName === iconName && "bg-primary/20 text-primary" // Highlight ikon terpilih
                    )}
                    onClick={() => handleIconSelect(iconName)}
                    title={iconName} // Tooltip nama ikon
                  >
                    <DynamicIcon name={iconName} className="h-5 w-5" /> {/* Ukuran ikon di grid */}
                  </Button>
                ))
             ) : (
                <div className="col-span-6 text-center text-sm text-muted-foreground py-4">
                    Ikon tidak ditemukan.
                </div>
             )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
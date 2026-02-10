'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Database } from 'lucide-react';

export function EnvSwitcher() {
    const [currentEnv, setCurrentEnv] = useState<string>('beta');

    useEffect(() => {
        const env = Cookies.get('NEXT_ADMIN_ENV') || 'beta';
        setCurrentEnv(env);
    }, []);

    const handleEnvChange = (value: string) => {
        Cookies.set('NEXT_ADMIN_ENV', value, { expires: 365 });
        setCurrentEnv(value);
        // Reload to fetch new data
        window.location.reload();
    };

    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-neutral-800 rounded-lg">
            <Database className="h-4 w-4 text-neutral-400" />
            <Select value={currentEnv} onValueChange={handleEnvChange}>
                <SelectTrigger className="w-32 h-8 bg-neutral-900 border-neutral-700">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="beta">Beta</SelectItem>
                    <SelectItem value="prod">Production</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}

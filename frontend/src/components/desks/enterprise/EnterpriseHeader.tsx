import './EnterpriseHeader.css';

interface EnterpriseHeaderProps {
    modeFilter: 'all' | 'build' | 'execute';
    setModeFilter: (value: 'all' | 'build' | 'execute') => void;
}

export function EnterpriseHeader({
    modeFilter,
    setModeFilter
}: EnterpriseHeaderProps) {
    // Mode filter moved to insights panel - this component no longer renders anything
    return null;
}

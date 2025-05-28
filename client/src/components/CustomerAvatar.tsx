interface CustomerAvatarProps {
  name: string;
  avatarColor?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeConfig = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

export default function CustomerAvatar({ 
  name, 
  avatarColor = "#1976D2", 
  size = "md",
  className = ""
}: CustomerAvatarProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const generateColorFromName = (name: string) => {
    // Generate a consistent color based on the name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 60%, 50%)`;
  };

  const displayColor = avatarColor || generateColorFromName(name);

  return (
    <div 
      className={`
        ${sizeConfig[size]} 
        rounded-xl 
        flex 
        items-center 
        justify-center 
        text-white 
        font-semibold 
        flex-shrink-0
        ${className}
      `}
      style={{ backgroundColor: displayColor }}
    >
      {getInitials(name)}
    </div>
  );
}

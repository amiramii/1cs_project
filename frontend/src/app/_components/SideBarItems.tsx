'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {SidebarMenuIcon} from '../../components/ui/sidebarMenuIcon'
import {useLanguage} from './language-provider'
import { getSideBarItems,AppSidebarRole } from '@/lib/constants'
const SideBarItems = ({
    expanded,
    role,
    onItemClick,
}:{
    expanded:boolean,
    role:AppSidebarRole,
    onItemClick?: () => void,
}) => {
    const pathName=usePathname();
    const {language, dir}=useLanguage();
    const items=getSideBarItems(language,role as AppSidebarRole);
  return (
    <>
    {items.map((item,index)=>{
        const isActive =
          pathName === item.href ||
          pathName.startsWith(`${item.href}/`) ||
          (item.href === "/Dashboard" && pathName.startsWith("/Dashboard"))
        return(
            <li key={index} className={`${isActive ? 'bg-blue-primary/15 dark:bg-white/10 text-blue-primary dark:text-white border-b-2 border-blue-primary dark:border-white md:border-b-0 md:border-s-4 md:border-blue-primary dark:md:border-white' : 'text-sidebar-foreground/70 border-b-2 border-transparent md:border-b-0 md:border-s-4 md:border-transparent'} group relative rounded-t-xl p-3 transition-colors md:w-full md:rounded-none md:rounded-e-xl md:pr-2 md:pe-2 `}>
                <Link
                  href={`${item.href}`}
                  onClick={onItemClick}
                  className={`flex w-full flex-col items-center justify-center gap-2 px-1 py-2 text-center text-[12px] font-semibold leading-tight transition-colors hover:bg-sidebar-accent/80 focus-visible:bg-sidebar-accent/80 focus-visible:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-0 md:px-2 md:text-sm ${
                    expanded
                      ? "md:flex-row md:items-center md:justify-center md:gap-2"
                      : "md:flex md:items-center md:justify-center md:gap-0"
                  }`}
                >
                <SidebarMenuIcon id={item.iconId} size={18} className="shrink-0" />
                <span
                  className={`${expanded ? "hidden md:inline-block" : "hidden"} w-full truncate text-center md:max-w-none ${
                    expanded ? "md:w-auto md:min-w-0 md:max-w-[min(100%,10.5rem)] md:text-start" : ""
                  }`}
                >
                  {item.label}
                </span>
                </Link>
                {!expanded && <div className={`absolute top-0 hidden text-nowrap rounded-2xl border border-sidebar-border bg-popover/90 p-2 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 md:block ${dir === "rtl" ? "right-[150%]" : "left-[150%]"} z-50`}>{item.label}</div>}
            </li>
        )
    })

    }
    </>
  )
}

export default SideBarItems
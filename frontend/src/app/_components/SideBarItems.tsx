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
    {items.map((item) => {
        const isActive =
          pathName === item.href ||
          pathName.startsWith(`${item.href}/`) ||
          (item.href === "/Dashboard" && pathName.startsWith("/Dashboard"))
        return(
            <li key={item.href} className={`${isActive ? 'border-b-2 border-[#51689A] bg-[#51689A]/15 dark:border-[#74A7BD] dark:bg-[#1B2065]/35 md:border-b-0 md:border-s-4 md:border-[#51689A] dark:md:border-[#74A7BD] text-[#51689A] dark:text-[#FEF9F9]' : 'border-b-2 border-transparent text-[#51689A]/70 md:border-s-4 md:border-transparent'} group relative rounded-t-xl p-3 transition-colors md:w-full md:rounded-none md:rounded-e-xl md:pr-2 md:pe-2 `}>
                <Link
                  href={`${item.href}`}
                  onClick={onItemClick}
                  className={`flex w-full flex-col items-center justify-center gap-2 px-1 py-2 text-center text-[12px] font-semibold leading-tight transition-colors  focus-visible:bg-[#74A7BD]/25 focus-visible:text-[#1B2065] focus-visible:outline-none focus-visible:ring-0  dark:focus-visible:text-[#FEF9F9] md:px-2 md:text-sm ${isActive ? 'text-inherit' : ''} ${
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
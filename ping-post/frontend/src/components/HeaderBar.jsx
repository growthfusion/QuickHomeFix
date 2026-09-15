import logo from '../assets/logo.png'

/**
 * Top identity strip: the GrowthFusion mark on the left, who-and-where
 * on the right.
 *
 * The account/IP block is not decoration -- when several people share a
 * login and someone asks "who changed this number", the first question
 * is which session they were in.
 */
export function HeaderBar({ user = 'Arun Rajendran', accountId = '15501825', ip = '107.180.130.1' }) {
  return (
    <div className="flex h-[54px] shrink-0 items-center justify-between border-b border-grid bg-white px-4">
      {/* The source image is 2085x626 with heavy transparent padding
          top and bottom, so sizing by height alone renders the wordmark
          tiny. Scale it up and crop the padding away instead. */}
      <div className="flex items-center gap-3 overflow-hidden">
        <img
          src={logo}
          alt="GrowthFusion"
          className="h-[74px] w-auto shrink-0 object-contain"
          style={{ clipPath: 'inset(32% 0 32% 0)', marginBlock: '-24px' }}
        />
        <span className="h-[18px] w-px shrink-0 bg-grid" />
        <span className="whitespace-nowrap text-[12.5px] font-medium text-text-secondary">
          Ping Post
        </span>
      </div>

      <div className="text-right text-[11px] leading-[1.45] text-text-secondary">
        <div className="font-medium text-text-primary">{user}</div>
        <div className="tnum">Account ID: {accountId}</div>
        <div className="tnum">IP Address: {ip}</div>
      </div>
    </div>
  )
}

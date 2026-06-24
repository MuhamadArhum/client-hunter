import React from 'react';

function CardStats({ subtitle, title, icon, iconBg, arrow, percent, percentColor, desc }) {
  return (
    <div className="relative flex flex-col min-w-0 break-words bg-white rounded mb-6 xl:mb-0 shadow-lg">
      <div className="flex-auto p-4">
        <div className="flex flex-wrap">
          <div className="relative w-full pr-4 max-w-full flex-grow flex-1">
            <h5 className="text-blueGray-400 uppercase font-bold text-xs">{subtitle}</h5>
            <span className="font-semibold text-xl text-blueGray-700">{title}</span>
          </div>
          <div className="relative w-auto pl-4 flex-initial">
            <div className={`text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-full ${iconBg}`}>
              <i className={icon}></i>
            </div>
          </div>
        </div>
        <p className="text-sm text-blueGray-400 mt-4">
          <span className={`${percentColor} mr-2`}>
            <i className={arrow === 'up' ? 'fas fa-arrow-up' : 'fas fa-arrow-down'}></i> {percent}%
          </span>
          <span className="whitespace-nowrap">{desc}</span>
        </p>
      </div>
    </div>
  );
}

export default function HeaderStats({ stats }) {
  const defaultStats = [
    { subtitle: 'Total Leads', title: stats?.totalLeads ?? '0', icon: 'fas fa-users', iconBg: 'bg-red-500', arrow: 'up', percent: '0', percentColor: 'text-emerald-500', desc: 'All time' },
    { subtitle: 'New This Week', title: stats?.newLeads ?? '0', icon: 'fas fa-user-plus', iconBg: 'bg-orange-500', arrow: 'up', percent: '0', percentColor: 'text-emerald-500', desc: 'This week' },
    { subtitle: 'Proposals Sent', title: stats?.proposals ?? '0', icon: 'fas fa-file-alt', iconBg: 'bg-pink-500', arrow: 'up', percent: '0', percentColor: 'text-emerald-500', desc: 'Total sent' },
    { subtitle: 'Conversion Rate', title: stats?.conversionRate ?? '0%', icon: 'fas fa-percent', iconBg: 'bg-violet-500', arrow: 'up', percent: '0', percentColor: 'text-emerald-500', desc: 'Overall' },
  ];

  return (
    <div className="relative bg-indigo-900 md:pt-32 pb-32 pt-12">
      <div className="px-4 md:px-10 mx-auto w-full">
        <div className="flex flex-wrap">
          {defaultStats.map((s, i) => (
            <div key={i} className="w-full lg:w-6/12 xl:w-3/12 px-4">
              <CardStats {...s} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

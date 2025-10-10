import React from 'react';


const tableHeaders = [
  'FORM', 'VISITS', 'CTR, %', 'CLICKS', 'CR, %', 'EMAILS', 'LEADS', 'SOLD', '%', 'APPTS', '%', 'UPSELLS', 'SOLD', '%', 'UPSELL_RATE, %', 'PPC', 'SOLD', '%', 'PPC_RATE, %', 'TOTAL REVENUE, $', 'LEADS, $', 'FB FORM, $', 'UPSELLS, $', 'PPC, $', 'REPOSTS, $', 'ADJUSTMENT, $', 'AVG PER LEAD, $', 'AVG PER SOLD, $', 'EPC, $', 'EPV, $'
];

const tableData = [
  { form: 'walk-in-shower', visits: 5604, ctr: '14.58', clicks: 817, cr: '7.23', emails: 501, leads: 405, sold: 382, soldPct: '94.32%', appts: 0, apptsPct: '0%', upsells: 69, upsellsSold: 36, upsellsSoldPct: '52.17%', upsellRate: '17.04%', ppc: 13, ppcSold: 3, ppcSoldPct: '23.08%', ppcRate: '3.21%', totalRevenue: '11673.75', leadsValue: '12382.8', fbFormValue: '0', upsellsValue: '406.7', ppcValue: '315', repostsValue: '0', adjustment: '-1430.75', avgPerLead: '28.82', avgPerSold: '30.56', epc: '14.29', epv: '2.08' },
  { form: 'bath-remodel', visits: 84, ctr: '51.19', clicks: 43, cr: '239.29', emails: 208, leads: 201, sold: 176, soldPct: '87.56%', appts: 0, apptsPct: '0%', upsells: 14, upsellsSold: 2, upsellsSoldPct: '14.29%', upsellRate: '6.97%', ppc: 11, ppcSold: 3, ppcSoldPct: '27.27%', ppcRate: '5.47%', totalRevenue: '3995.44', leadsValue: '4354.34', fbFormValue: '0', upsellsValue: '26.24', ppcValue: '184.24', repostsValue: '0', adjustment: '-569.38', avgPerLead: '19.88', avgPerSold: '22.7', epc: '92.92', epv: '47.56' },
  { form: 'window', visits: 233, ctr: '79.83', clicks: 186, cr: '63.52', emails: 160, leads: 148, sold: 47, soldPct: '31.76%', appts: 0, apptsPct: '0%', upsells: 29, upsellsSold: 3, upsellsSoldPct: '10.34%', upsellRate: '19.59%', ppc: 4, ppcSold: 0, ppcSoldPct: '0%', ppcRate: '2.7%', totalRevenue: '359.56', leadsValue: '405.92', fbFormValue: '0', upsellsValue: '16.33', ppcValue: '0', repostsValue: '0', adjustment: '-62.69', avgPerLead: '2.43', avgPerSold: '7.65', epc: '1.93', epv: '1.54' },
  { form: 'roof', visits: 233, ctr: '46.35', clicks: 108, cr: '28.33', emails: 73, leads: 66, sold: 49, soldPct: '74.24%', appts: 0, apptsPct: '0%', upsells: 9, upsellsSold: 4, upsellsSoldPct: '44.44%', upsellRate: '13.64%', ppc: 0, ppcSold: 0, ppcSoldPct: '0%', ppcRate: '0%', totalRevenue: '807.68', leadsValue: '832.27', fbFormValue: '0', upsellsValue: '63.96', ppcValue: '0', repostsValue: '0', adjustment: '-88.55', avgPerLead: '12.24', avgPerSold: '16.48', epc: '7.48', epv: '3.47' },
  { form: 'walk-in-tubs', visits: 101, ctr: '50.5', clicks: 51, cr: '35.64', emails: 27, leads: 36, sold: 30, soldPct: '83.33%', appts: 0, apptsPct: '0%', upsells: 3, upsellsSold: 3, upsellsSoldPct: '100%', upsellRate: '8.33%', ppc: 2, ppcSold: 1, ppcSoldPct: '50%', ppcRate: '5.56%', totalRevenue: '400.22', leadsValue: '432.9', fbFormValue: '0', upsellsValue: '31.22', ppcValue: '17.28', repostsValue: '0', adjustment: '-81.18', avgPerLead: '11.12', avgPerSold: '13.34', epc: '7.85', epv: '3.96' },
  { form: 'siding', visits: 55, ctr: '72.73', clicks: 40, cr: '43.64', emails: 31, leads: 24, sold: 10, soldPct: '41.67%', appts: 0, apptsPct: '0%', upsells: 8, upsellsSold: 4, upsellsSoldPct: '50%', upsellRate: '33.33%', ppc: 0, ppcSold: 0, ppcSoldPct: '0%', ppcRate: '0%', totalRevenue: '255.67', leadsValue: '243.89', fbFormValue: '0', upsellsValue: '37.41', ppcValue: '0', repostsValue: '0', adjustment: '-25.63', avgPerLead: '10.65', avgPerSold: '25.57', epc: '6.39', epv: '4.65' },
];

function Form() {
  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-auto mx-auto">
        {/* Container for the table with horizontal scrolling */}
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full text-sm divide-y divide-gray-200">
           
            <thead className="bg-[#edf2fa]">
              <tr>
                {tableHeaders.map((header) => (
                  <th
                    key={header}
                    scope="col"
                    // First column is left-aligned, others are right-aligned
                    className={`px-6 py-3 whitespace-nowrap text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      header === 'FORM' ? 'text-left' : 'text-right'
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            {/* Table Body */}
            <tbody className="bg-white divide-y divide-gray-200">
              {tableData.map((row) => (
                <tr key={row.form} className="hover:bg-yellow-50">
                  {/* Dynamically create cells for each row */}
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">{row.form}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-right">{row.visits}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-right">{row.ctr}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-right">{row.clicks}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-right">{row.cr}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-right">{row.emails}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-right">{row.leads}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-right">{row.sold}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-right">{row.soldPct}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-right">{row.appts}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-right">{row.apptsPct}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-right">{row.upsells}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-right">{row.upsellsSold}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-right">{row.upsellsSoldPct}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-right">{row.upsellRate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-right">{row.ppc}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-right">{row.ppcSold}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-right">{row.ppcSoldPct}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-right">{row.ppcRate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-right">{row.totalRevenue}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-right">{row.leadsValue}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-right">{row.fbFormValue}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-right">{row.upsellsValue}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-right">{row.ppcValue}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-right">{row.repostsValue}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-right">{row.adjustment}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-right">{row.avgPerLead}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-right">{row.avgPerSold}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-right">{row.epc}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-right">{row.epv}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Form;
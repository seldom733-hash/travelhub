import { readFileSync, writeFileSync } from 'fs';

let c = readFileSync('src/app/services/[id]/page.tsx', 'utf8');

// Find the old selectedRoom total block and replace it
const oldBlock = `{selectedRoom ? (
                      <>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-500">
                            {effectivePrice} {service.currency} × {nights} {nights === 1 ? t('serviceDetail.night') : t('serviceDetail.nights')}
                          </span>
                          <span className="font-medium text-secondary">{(effectivePrice * nights).toLocaleString()} {service.currency}</span>
                        </div>
                        {(adults + children) > 1 && (
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500">× {adults + children} {t("serviceDetail.persons")}</span>
                            <span className="font-medium text-secondary">{(effectivePrice * nights * (adults + children)).toLocaleString()} {service.currency}</span>
                          </div>
                        )}
                      </>
                    ) :`;

const newBlock = `{selectedRoom ? (
                      <>
                        {adults > 0 && (
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500">
                              {adults} × {effectivePrice} {service.currency} × {nights} {nights === 1 ? t('serviceDetail.night') : t('serviceDetail.nights')}
                            </span>
                            <span className="font-medium text-secondary">{(adults * effectivePrice * nights).toLocaleString()} {service.currency}</span>
                          </div>
                        )}
                        {children > 0 && (
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500">
                              {children} × {childNightlyPrice} {service.currency} × {nights} {nights === 1 ? t('serviceDetail.night') : t('serviceDetail.nights')}
                            </span>
                            <span className="font-medium text-secondary">{(children * childNightlyPrice * nights).toLocaleString()} {service.currency}</span>
                          </div>
                        )}
                      </>
                    ) :`;

if (c.includes(oldBlock)) {
  c = c.replace(oldBlock, newBlock);
  writeFileSync('src/app/services/[id]/page.tsx', c, 'utf8');
  console.log('Updated: separate adult/child price lines');
} else {
  console.log('Pattern not found - checking current state');
  // Show context around the Total comment
  const idx = c.indexOf('{/* Total */}');
  if (idx >= 0) {
    console.log('Total section found at index', idx);
    console.log(c.substring(idx, idx + 500));
  }
}

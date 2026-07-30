import { readFileSync, writeFileSync } from 'fs';

let c = readFileSync('src/app/services/[id]/page.tsx', 'utf8');

// Find and replace the child price line in the total section
const oldChildLine = `{children > 0 && (
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500">
                              {children} × {childNightlyPrice} {service.currency} × {nights} {nights === 1 ? t('serviceDetail.night') : t('serviceDetail.nights')}
                            </span>
                            <span className="font-medium text-secondary">{(children * childNightlyPrice * nights).toLocaleString()} {service.currency}</span>
                          </div>
                        )}`;

const newChildBlock = `{children > 0 && childNightlyPrice > 0 && (
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500">
                              {children} × {childNightlyPrice} {service.currency} × {nights} {nights === 1 ? t('serviceDetail.night') : t('serviceDetail.nights')}
                            </span>
                            <span className="font-medium text-secondary">{(children * childNightlyPrice * nights).toLocaleString()} {service.currency}</span>
                          </div>
                        )}
                        {children > 0 && childNightlyPrice === 0 && (
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500">
                              {children} {children === 1 ? t('serviceDetail.child') : t('serviceDetail.childrenPlural')}
                            </span>
                            <span className="text-green-600 font-medium">✓ {t('serviceDetail.freeForChildren')}</span>
                          </div>
                        )}`;

if (c.includes(oldChildLine)) {
  c = c.replace(oldChildLine, newChildBlock);
  writeFileSync('src/app/services/[id]/page.tsx', c, 'utf8');
  console.log('Updated: child price line now shows "Free for children" when childNightlyPrice === 0');
} else {
  console.log('Pattern not found');
}

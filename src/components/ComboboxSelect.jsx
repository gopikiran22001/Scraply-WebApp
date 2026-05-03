import React, { Fragment, useState, useEffect } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { Check, ChevronDown, Search } from 'lucide-react';
import clsx from 'clsx';

/**
 * Reusable ComboboxSelect component for searchable selection via Headless UI.
 * 
 * @param {Object} props
 * @param {string|Object} props.value - Selected value
 * @param {function} props.onChange - Change handler (value) => void
 * @param {Array<string|{value: any, label: string}>} props.options - Array of options
 * @param {string} [props.label] - Label for the combobox
 * @param {string} [props.id] - ID for the combobox input
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.className] - Wrapper class name
 * @param {boolean} [props.disabled] - Disabled state
 * @param {string} [props.name] - Name attribute for forms
 * @param {string} [props.direction='down'] - Dropdown direction ('up' or 'down')
 */
export default function ComboboxSelect({
    value,
    onChange,
    options = [],
    label,
    id,
    placeholder = 'Search...',
    className,
    disabled = false,
    name,
    direction = 'down',
}) {
    const [query, setQuery] = useState('');

    // Normalize options to { value, label } format
    const normalizedOptions = options.map(opt => {
        if (typeof opt === 'string' || typeof opt === 'number') {
            return { value: opt, label: String(opt) };
        }
        return opt;
    });

    const selectedOption = normalizedOptions.find(opt => opt.value === value) || null;

    const filteredOptions =
        query === ''
            ? normalizedOptions
            : normalizedOptions.filter((opt) => {
                return opt.label.toLowerCase().includes(query.toLowerCase());
            });

    function ScrollLock({ active }) {
        useEffect(() => {
            if (active) {
                document.documentElement.style.overflow = 'hidden';
            } else {
                document.documentElement.style.overflow = '';
            }
            return () => {
                document.documentElement.style.overflow = '';
            };
        }, [active]);
        return null;
    }

    return (
        <div className={clsx("w-full", className)}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>
            )}
            <Combobox
                value={selectedOption}
                onChange={(opt) => {
                    onChange(opt ? opt.value : '');
                }}
                disabled={disabled}
                name={name}
            >
                {({ open }) => (
                    <>
                        <ScrollLock active={open} />
                        <div className="relative mt-1">
                            <div className={clsx(
                                "relative w-full cursor-text overflow-hidden rounded-lg bg-white border border-gray-200 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-white/75 focus-within:ring-offset-2 focus-within:ring-offset-primary-300 sm:text-sm transition-all",
                                disabled && "opacity-50 cursor-not-allowed bg-gray-50",
                                open ? "border-primary-500 ring-2 ring-white/75 ring-offset-2 ring-offset-primary-300" : ""
                            )}>
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <Search className="h-4 w-4" />
                                </span>
                                <Combobox.Input
                                    id={id}
                                    className="w-full border-none py-2.5 pl-9 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 outline-none bg-transparent"
                                    displayValue={(opt) => (opt ? opt.label : '')}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder={placeholder}
                                    autoComplete="off"
                                />
                                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                    <ChevronDown
                                        className="h-5 w-5 text-gray-400"
                                        aria-hidden="true"
                                    />
                                </Combobox.Button>
                            </div>
                            <Transition
                                as={Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                                afterLeave={() => setQuery('')}
                            >
                                <Combobox.Options className={clsx(
                                    "absolute w-full max-h-60 overflow-y-auto dropdown-scrollbar rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-50",
                                    direction === 'up' ? "bottom-full mb-1" : "mt-1 top-full"
                                )}>
                                    {filteredOptions.length === 0 && query !== '' ? (
                                        <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                            No matches found.
                                        </div>
                                    ) : (
                                        filteredOptions.map((option, optionIdx) => (
                                            <Combobox.Option
                                                key={optionIdx}
                                                className={({ active }) =>
                                                    clsx(
                                                        "relative cursor-default select-none py-2 pl-3 pr-10",
                                                        active ? "bg-primary-100 text-primary-900" : "text-gray-900"
                                                    )
                                                }
                                                value={option}
                                            >
                                                {({ selected }) => (
                                                    <>
                                                        <span
                                                            className={clsx(
                                                                "block truncate",
                                                                selected ? "font-medium" : "font-normal"
                                                            )}
                                                        >
                                                            {option.label}
                                                        </span>
                                                        {selected ? (
                                                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-primary-600">
                                                                <Check className="h-5 w-5" aria-hidden="true" />
                                                            </span>
                                                        ) : null}
                                                    </>
                                                )}
                                            </Combobox.Option>
                                        ))
                                    )}
                                </Combobox.Options>
                            </Transition>
                        </div>
                    </>
                )}
            </Combobox>
        </div>
    );
}

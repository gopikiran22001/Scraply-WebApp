import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

/**
 * Reusable ListboxSelect component using Headless UI.
 * 
 * @param {Object} props
 * @param {string|Object} props.value - Selected value
 * @param {function} props.onChange - Change handler (value) => void
 * @param {Array<string|{value: any, label: string}>} props.options - Array of options
 * @param {string} [props.label] - Label for the listbox
 * @param {string} [props.id] - ID for the listbox button
 * @param {React.ReactNode} [props.leftIcon] - Icon to display on the left
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.className] - Wrapper class name
 * @param {function} [props.renderOption] - Custom render function for options
 * @param {boolean} [props.disabled] - Disabled state
 * @param {string} [props.name] - Name attribute for forms
 */
export default function ListboxSelect({
    value,
    onChange,
    options = [],
    label,
    id,
    leftIcon,
    placeholder = 'Select an option',
    className,
    renderOption,
    disabled = false,
    name,
}) {
    // Normalize options to { value, label } format
    const normalizedOptions = options.map(opt => {
        if (typeof opt === 'string' || typeof opt === 'number') {
            return { value: opt, label: String(opt) };
        }
        return opt;
    });

    // Find selected option object to display label
    const selectedOption = normalizedOptions.find(opt => opt.value === value) || null;

    return (
        <div className={clsx("w-full", className)}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>
            )}
            <Listbox value={value} onChange={onChange} disabled={disabled} name={name}>
                <div className="relative mt-1">
                    <Listbox.Button
                        id={id}
                        className={clsx(
                            "relative w-full cursor-default rounded-lg bg-white py-2 text-left border border-gray-200 focus:outline-none focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-300 sm:text-sm transition-all",
                            leftIcon ? "pl-10 pr-10" : "pl-3 pr-10",
                            disabled && "opacity-50 cursor-not-allowed bg-gray-50"
                        )}
                    >
                        {leftIcon && (
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                {leftIcon}
                            </span>
                        )}
                        <span className={clsx("block truncate", !selectedOption && "text-gray-400")}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronDown
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                            />
                        </span>
                    </Listbox.Button>
                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-50">
                            {normalizedOptions.map((option, optionIdx) => (
                                <Listbox.Option
                                    key={optionIdx}
                                    className={({ active }) =>
                                        clsx(
                                            "relative cursor-default select-none py-2 pl-10 pr-4",
                                            active ? "bg-primary-100 text-primary-900" : "text-gray-900"
                                        )
                                    }
                                    value={option.value}
                                >
                                    {({ selected }) => (
                                        <>
                                            <span
                                                className={clsx(
                                                    "block truncate",
                                                    selected ? "font-medium" : "font-normal"
                                                )}
                                            >
                                                {renderOption ? renderOption(option) : option.label}
                                            </span>
                                            {selected ? (
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600">
                                                    <Check className="h-5 w-5" aria-hidden="true" />
                                                </span>
                                            ) : null}
                                        </>
                                    )}
                                </Listbox.Option>
                            ))}
                        </Listbox.Options>
                    </Transition>
                </div>
            </Listbox>
        </div>
    );
}

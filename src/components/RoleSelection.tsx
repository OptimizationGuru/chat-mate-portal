import { Role } from '@/types';
import React from 'react';

interface RoleSelectionProps {
  roles: Role[];
  onSelectRole: (role: string) => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({
  roles,
  onSelectRole,
}) => (
  <div className="bg-gray-50 shadow-md rounded-2xl p-6 w-full max-w-md mx-auto">
    <h2 className="text-xl font-semibold text-blue-700 text-center mb-4">
      Select Your Role
    </h2>
    <div className="flex flex-col gap-3">
      {roles.map((role) => (
        <label
          key={role.id}
          className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all hover:bg-blue-50 hover:border-blue-500"
        >
          <input
            type="radio"
            name="role"
            value={role.value}
            onChange={() => onSelectRole(role.value)}
            className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 accent-blue-500"
          />
          <span className="text-lg text-gray-700 font-medium">{role.role}</span>
        </label>
      ))}
    </div>
  </div>
);

export default RoleSelection;

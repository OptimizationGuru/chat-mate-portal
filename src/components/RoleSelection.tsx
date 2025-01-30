import React from 'react';

interface Role {
  id: number;
  role: string;
  value: string;
}

interface RoleSelectionProps {
  roles: Role[];
  onSelectRole: (role: string) => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({
  roles,
  onSelectRole,
}) => (
  <div className="flex flex-col items-center gap-6 bg-white p-6 rounded-lg shadow-xs w-1/2 mt-4">
    <h2 className="text-2xl font-semibold text-gray-800">Select Your Role</h2>
    <div className="flex flex-col gap-4 w-full">
      {roles.map((role) => (
        <label
          key={role.id}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition duration-200 ease-in-out cursor-pointer"
        >
          <input
            type="radio"
            name="role"
            value={role.value}
            onChange={() => onSelectRole(role.value)}
            className="w-5 h-5 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-lg text-gray-700 font-medium">{role.role}</span>
        </label>
      ))}
    </div>
  </div>
);

export default RoleSelection;

import { UserPlusIcon, UsersIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const Card = ({ title, Icon, to }) => {
    return (
        <Link
            to={to}
            className="w-11/12 sm:w-3/4 md:w-1/2 lg:w-1/3 
                 flex items-center justify-between 
                 border border-gray-200 
                 rounded-2xl shadow-md 
                 p-4 bg-white 
                 cursor-pointer
                 transition-all duration-200 
                 hover:scale-105 hover:shadow-xl hover:bg-gray-100"
        >
            <h3 className="font-semibold text-gray-800 text-base sm:text-lg">
                {title}
            </h3>
            <Icon className="w-6 h-6 text-gray-800" />
        </Link>
    );
};

const HomeAdmin = () => {
    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-50 py-10 gap-6">

            <Card title="Usuarios" Icon={UserPlusIcon} to="/usuarios" />
            <Card title="Trabajador Social" Icon={UsersIcon} to="/trabajadoraSocial" />
            <Card title="Expedientes" Icon={DocumentTextIcon} to="/expedientes" />

        </div>
    );
};

export default HomeAdmin;